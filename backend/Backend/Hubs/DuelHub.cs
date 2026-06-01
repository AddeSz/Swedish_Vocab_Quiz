using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Backend.Services;

namespace Backend.Hubs;

[Authorize]
public class DuelHub : Hub
{
  private readonly DuelManager _duelManager;
  private readonly AppDbContext _dbContext;

  public DuelHub(DuelManager duelManager, AppDbContext dbContext)
  {
    _duelManager = duelManager;
    _dbContext = dbContext;
  }

  private Guid GetUserId()
  {
    var userIdClaim = Context.User?.FindFirst("sub")?.Value;
    if (string.IsNullOrEmpty(userIdClaim)) throw new HubException("User not authenticated");
    return Guid.Parse(userIdClaim);
  }

  public override async Task OnConnectedAsync()
  {
    var userId = GetUserId();
    var user = await _dbContext.Users.FindAsync(userId);
    if (user != null)
    {
      await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
    }
    await base.OnConnectedAsync();
  }

  public async Task JoinMatchmaking()
  {
    var userId = GetUserId();
    var user = await _dbContext.Users.FindAsync(userId);
    if (user == null) throw new HubException("User not found");
    
    _duelManager.EnqueueUser(userId, user.DisplayName, Context.ConnectionId);
  }

  public async Task JoinDuelGroup(Guid duelId)
  {
    var userId = GetUserId();
    var duel = _duelManager.GetDuel(duelId);
    if (duel == null) throw new HubException("Duel not found");
    if (duel.Player1UserId != userId && duel.Player2UserId != userId) throw new HubException("Not a participant");

    await Groups.AddToGroupAsync(Context.ConnectionId, $"duel-{duelId}");
    _duelManager.UpdateConnectionId(userId, Context.ConnectionId);

    duel.PlayersJoined++;
    if (duel.PlayersJoined == 2)
    {
      await _duelManager.StartQuestion(duelId);
    }
  }

  public async Task LeaveMatchmaking()
  {
    var userId = GetUserId();
    _duelManager.DequeueUser(userId);
  }

  public async Task SubmitAnswer(Guid duelId, int answerIndex)
  {
    var userId = GetUserId();
    await _duelManager.SubmitAnswer(duelId, userId, answerIndex);
  }

  public async Task ReadyForNext(Guid duelId)
  {
    var userId = GetUserId();
    await _duelManager.MarkPlayerReady(duelId, userId);
  }

  public async Task ReconnectToDuel(Guid duelId)
  {
    var userId = GetUserId();
    var duel = _duelManager.GetDuel(duelId);
    if (duel == null) throw new HubException("Duel not found");
    if (duel.Player1UserId != userId && duel.Player2UserId != userId) throw new HubException("Not a participant");

    await Groups.AddToGroupAsync(Context.ConnectionId, $"duel-{duelId}");
    await _duelManager.HandleReconnect(userId, Context.ConnectionId);
    await Clients.Caller.SendAsync("StateRestored", duel);
  }

  public override async Task OnDisconnectedAsync(Exception? exception)
  {
    var userId = GetUserId();
    await _duelManager.HandleDisconnect(userId);
    await base.OnDisconnectedAsync(exception);
  }
}
