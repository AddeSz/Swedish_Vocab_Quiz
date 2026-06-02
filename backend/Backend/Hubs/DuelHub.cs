using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Backend.Services;

namespace Backend.Hubs;

[Authorize]
public class DuelHub : Hub
{
  private readonly DuelManager _duelManager;
  private readonly CurrentUserService _currentUserService;

  public DuelHub(
      DuelManager duelManager,
      CurrentUserService currentUserService)
  {
    _duelManager = duelManager;
    _currentUserService = currentUserService;
  }

  private async Task<User> GetCurrentUserAsync()
  {
    try
    {
      return await _currentUserService.GetRequiredUserAsync();
    }
    catch (UnauthorizedAccessException)
    {
      throw new HubException("User not authenticated");
    }
  }

  public override async Task OnConnectedAsync()
  {
    var user = await GetCurrentUserAsync();

    await Groups.AddToGroupAsync(
        Context.ConnectionId,
        $"user-{user.Id}");
    await base.OnConnectedAsync();
  }

  public async Task JoinMatchmaking()
  {
    var user = await GetCurrentUserAsync();

    _duelManager.EnqueueUser(
        user.Id,
        user.DisplayName,
        Context.ConnectionId);
  }

  public async Task JoinDuelGroup(string duelId)
  {
    Console.WriteLine($"JoinDuelGroup received: '{duelId}'");
    if (!Guid.TryParse(duelId, out var parsedDuelId))
      throw new HubException("Invalid duel ID");

    var user = await GetCurrentUserAsync();
    var userId = user.Id;
    var duel = _duelManager.GetDuel(parsedDuelId);
    if (duel == null) throw new HubException("Duel not found");
    if (duel.Player1UserId != userId && duel.Player2UserId != userId) throw new HubException("Not a participant");

    await Groups.AddToGroupAsync(Context.ConnectionId, $"duel-{parsedDuelId}");
    _duelManager.UpdateConnectionId(userId, Context.ConnectionId);

    duel.PlayersJoined++;
    if (duel.PlayersJoined == 2)
    {
      await _duelManager.StartQuestion(parsedDuelId);
    }
  }

  public async Task LeaveMatchmaking()
  {
    var user = await GetCurrentUserAsync();
    _duelManager.DequeueUser(user.Id);
  }

  public async Task SubmitAnswer(string duelId, int answerIndex)
  {
    if (!Guid.TryParse(duelId, out var parsedDuelId))
      throw new HubException("Invalid duel ID");

    var user = await GetCurrentUserAsync();
    await _duelManager.SubmitAnswer(parsedDuelId, user.Id, answerIndex);
  }

  public async Task ReadyForNext(string duelId)
  {
    if (!Guid.TryParse(duelId, out var parsedDuelId))
      throw new HubException("Invalid duel ID");

    var user = await GetCurrentUserAsync();
    await _duelManager.MarkPlayerReady(parsedDuelId, user.Id);
  }

  public async Task ReconnectToDuel(string duelId)
  {
    if (!Guid.TryParse(duelId, out var parsedDuelId))
      throw new HubException("Invalid duel ID");

    var user = await GetCurrentUserAsync();
    var userId = user.Id;
    var duel = _duelManager.GetDuel(parsedDuelId);
    if (duel == null) throw new HubException("Duel not found");
    if (duel.Player1UserId != userId && duel.Player2UserId != userId) throw new HubException("Not a participant");

    await Groups.AddToGroupAsync(Context.ConnectionId, $"duel-{parsedDuelId}");
    await _duelManager.HandleReconnect(userId, Context.ConnectionId);
    await Clients.Caller.SendAsync("StateRestored", duel);
  }

  public override async Task OnDisconnectedAsync(Exception? exception)
  {
    var user = await GetCurrentUserAsync();
    await _duelManager.HandleDisconnect(user.Id);
    await base.OnDisconnectedAsync(exception);
  }
}
