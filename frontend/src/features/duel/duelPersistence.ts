import type { PersistedDuelState } from "./types";

export function getPersistedState(duelId: string): PersistedDuelState | null {
  try {
    const raw = sessionStorage.getItem(`duel-result-${duelId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function persistState(duelId: string, state: PersistedDuelState) {
  try {
    sessionStorage.setItem(`duel-result-${duelId}`, JSON.stringify(state));
  } catch {}
}

export function clearPersistedState(duelId: string) {
  sessionStorage.removeItem(`duel-result-${duelId}`);
}
