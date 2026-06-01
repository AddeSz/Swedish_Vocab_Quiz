using Backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DuelController : ControllerBase
{
  private readonly AppDbContext _dbContext;
  private readonly CurrentUserService _currentUser;

  public DuelController(AppDbContext dbContext, CurrentUserService currentUser)
  {
    _dbContext = dbContext;
    _currentUser = currentUser;
  }

  [HttpGet("stats")]
  public async Task<ActionResult<DuelStatsDto>> GetStats()
  {
    var user = await _currentUser.GetRequiredUserAsync();
    var stats = await _dbContext.DuelStats.FindAsync(user.Id);

    if (stats == null)
    {
      return Ok(new DuelStatsDto(0, 0, 0, 0));
    }

    var totalGames = stats.Wins + stats.Ties + stats.Losses;
    var winRate = totalGames > 0 ? (double)stats.Wins / totalGames * 100 : 0;

    return Ok(new DuelStatsDto(stats.Wins, stats.Ties, stats.Losses, Math.Round(winRate, 1)));
  }

  [HttpGet("history")]
  public async Task<ActionResult<List<DuelHistoryDto>>> GetHistory()
  {
    var user = await _currentUser.GetRequiredUserAsync();
    var userId = user.Id;

    var history = await _dbContext.DuelHistories
      .Include(h => h.Player1)
      .Include(h => h.Player2)
      .Where(h => h.Player1UserId == userId || h.Player2UserId == userId)
      .OrderByDescending(h => h.CompletedAtUtc)
      .Take(20)
      .ToListAsync();

    var dtos = history.Select(h =>
    {
      var isPlayer1 = h.Player1UserId == userId;
      var opponentName = isPlayer1 ? h.Player2.DisplayName : h.Player1.DisplayName;
      var isWin = h.WinnerUserId == userId;
      var isTie = h.WinnerUserId == null;

      return new DuelHistoryDto(h.Id, opponentName, isWin, isTie, h.CompletedAtUtc);
    }).ToList();

    return Ok(dtos);
  }
}
