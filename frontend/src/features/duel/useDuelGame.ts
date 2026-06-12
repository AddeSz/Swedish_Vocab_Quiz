import type { HubConnection } from "@microsoft/signalr";
import { useEffect, useReducer, useRef, useState } from "react";
import { useBlocker, useNavigate } from "react-router-dom";
import { useDuel } from "../../context/DuelContext";
import { duelGameReducer } from "./duelGameReducer";
import { initialDuelGameState } from "./duelGameState";
import {
  clearPersistedState,
  getPersistedState,
  persistState
} from "./duelPersistence";
import { mapRejoinState } from "./rejoinMapper";
import type {
  DuelQuestion,
  DuelResult,
  DuelReview,
  RejoinState
} from "./types";

interface UseDuelGameOptions {
  duelId: string;
  isPlayer1: boolean;
}

export function useDuelGame({ duelId, isPlayer1 }: UseDuelGameOptions) {
  const navigate = useNavigate();
  const { connect, disconnect } = useDuel();

  const persisted = getPersistedState(duelId);

  const [state, dispatch] = useReducer(duelGameReducer, {
    ...initialDuelGameState,
    ...(persisted ? { phase: persisted.phase, result: persisted.result } : {})
  });

  const hubRef = useRef<HubConnection | null>(null);
  const duelSetupDoneRef = useRef<string | null>(null);
  // Keep a ref so SignalR close/reconnect callbacks always read current phase
  const phaseRef = useRef(state.phase);
  phaseRef.current = state.phase;

  // ─── Leave-confirm (UI state, not game state) ───────────────────────────────
  const isDuelActive = state.phase === "question" || state.phase === "review";

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const blocker = useBlocker(isDuelActive);

  useEffect(() => {
    if (blocker.state === "blocked") setShowLeaveConfirm(true);
  }, [blocker.state]);

  useEffect(() => {
    if (!isDuelActive) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDuelActive]);

  // ─── Disconnect when game ends ───────────────────────────────────────────────
  useEffect(() => {
    if (state.phase === "completed" || state.phase === "forfeited") {
      disconnect();
    }
  }, [state.phase]);

  // ─── SignalR setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (persisted) return;
    if (duelSetupDoneRef.current === duelId) return;
    duelSetupDoneRef.current = duelId;

    let questionHandler: ((data: DuelQuestion) => void) | undefined;
    let reviewHandler: ((data: DuelReview) => void) | undefined;
    let completedHandler: ((data: DuelResult) => void) | undefined;
    let forfeitHandler: (() => void) | undefined;
    let opponentDisconnectedHandler:
      | ((data: { timeoutSeconds: number }) => void)
      | undefined;
    let opponentReconnectedHandler: (() => void) | undefined;

    const setupDuel = async () => {
      try {
        const hub = await connect();
        hubRef.current = hub;

        questionHandler = (data) =>
          dispatch({ type: "QUESTION_STARTED", payload: data });
        hub.on("QuestionStarted", questionHandler);

        reviewHandler = (data) =>
          dispatch({
            type: "REVIEW_STARTED",
            payload: {
              review: data,
              myScore: isPlayer1 ? data.player1Score : data.player2Score,
              opponentScore: isPlayer1 ? data.player2Score : data.player1Score
            }
          });
        hub.on("ReviewStarted", reviewHandler);

        completedHandler = (data) => {
          dispatch({ type: "DUEL_COMPLETED", payload: data });
          persistState(duelId, { phase: "completed", result: data });
        };
        hub.on("DuelCompleted", completedHandler);

        forfeitHandler = () => {
          dispatch({ type: "FORFEIT" });
          persistState(duelId, { phase: "forfeited", result: null });
        };
        hub.on("Forfeit", forfeitHandler);

        opponentDisconnectedHandler = (data) =>
          dispatch({
            type: "OPPONENT_DISCONNECTED",
            payload: data.timeoutSeconds
          });
        hub.on("OpponentDisconnected", opponentDisconnectedHandler);

        opponentReconnectedHandler = () =>
          dispatch({ type: "OPPONENT_RECONNECTED" });
        hub.on("OpponentReconnected", opponentReconnectedHandler);

        hub.onreconnecting(() =>
          dispatch({ type: "SET_RECONNECTING", payload: true })
        );

        hub.onreconnected(async () => {
          dispatch({ type: "SET_RECONNECTING", payload: false });
          try {
            await hub.invoke("JoinDuelGroup", duelId);
            const rejoinState = await hub.invoke<RejoinState | null>(
              "RejoinDuel",
              duelId
            );
            if (!rejoinState) {
              navigate("/duel");
              return;
            }
            dispatch({
              type: "RECONNECTED_STATE",
              payload: mapRejoinState(rejoinState, isPlayer1)
            });
          } catch (err) {
            console.error("Failed to rejoin duel:", err);
            navigate("/");
          }
        });

        hub.onclose(() => {
          if (
            phaseRef.current === "completed" ||
            phaseRef.current === "forfeited"
          )
            return;
          navigate("/");
        });

        await hub.invoke("JoinDuelGroup", duelId);

        const rejoinState = await hub.invoke<RejoinState | null>(
          "RejoinDuel",
          duelId
        );
        if (rejoinState) {
          dispatch({
            type: "RECONNECTED_STATE",
            payload: mapRejoinState(rejoinState, isPlayer1)
          });
        } else {
          await hub.invoke("ReadyToPlay", duelId);
        }
      } catch (err) {
        console.error("Failed to setup duel:", err);
        navigate("/");
      }
    };

    setupDuel();

    return () => {
      if (questionHandler)
        hubRef.current?.off("QuestionStarted", questionHandler);
      if (reviewHandler) hubRef.current?.off("ReviewStarted", reviewHandler);
      if (completedHandler)
        hubRef.current?.off("DuelCompleted", completedHandler);
      if (forfeitHandler) hubRef.current?.off("Forfeit", forfeitHandler);
      if (opponentDisconnectedHandler)
        hubRef.current?.off(
          "OpponentDisconnected",
          opponentDisconnectedHandler
        );
      if (opponentReconnectedHandler)
        hubRef.current?.off("OpponentReconnected", opponentReconnectedHandler);
      duelSetupDoneRef.current = null;
    };
  }, [duelId]);

  // ─── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      hubRef.current?.invoke("LeaveDuel", duelId).catch(() => {});
    };
  }, [duelId]);

  // ─── Countdown timers ────────────────────────────────────────────────────────
  useEffect(() => {
    if (
      (state.phase === "question" || state.phase === "review") &&
      state.timeLeft > 0
    ) {
      const timer = setTimeout(
        () => dispatch({ type: "SET_TIME_LEFT", payload: state.timeLeft - 1 }),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [state.timeLeft, state.phase]);

  useEffect(() => {
    if (!state.opponentDisconnected) return;
    if (state.opponentDisconnectSecondsLeft <= 0) return;
    const timer = setTimeout(
      () =>
        dispatch({
          type: "OPPONENT_DISCONNECTED",
          payload: state.opponentDisconnectSecondsLeft - 1
        }),
      1000
    );
    return () => clearTimeout(timer);
  }, [state.opponentDisconnected, state.opponentDisconnectSecondsLeft]);

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const answer = async (index: number) => {
    if (state.phase !== "question") return;
    dispatch({ type: "ANSWER_SELECTED", payload: index });
    try {
      await hubRef.current?.invoke("SubmitAnswer", duelId, index);
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }
  };

  const ready = async () => {
    if (state.isReady) return;
    dispatch({ type: "READY" });
    try {
      await hubRef.current?.invoke("ReadyForNext", duelId);
    } catch (err) {
      console.error("Failed to mark ready:", err);
      // Roll back optimistic update
      dispatch({ type: "READY" }); // isReady stays true; server will resync
    }
  };

  const leave = (to: string) => {
    clearPersistedState(duelId);
    navigate(to);
  };

  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    clearPersistedState(duelId);
    blocker.proceed?.();
  };

  const cancelLeave = () => {
    setShowLeaveConfirm(false);
    blocker.reset?.();
  };

  return {
    state,
    answer,
    ready,
    leave,
    confirmLeave,
    cancelLeave,
    showLeaveConfirm
  };
}
