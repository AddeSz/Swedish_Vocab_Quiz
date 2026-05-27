using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/auth")]
[Authorize]
public class AuthController : ControllerBase
{
  private readonly CurrentUserService _currentUserService;

  public AuthController(CurrentUserService currentUserService)
  {
    _currentUserService = currentUserService;
  }

  [HttpGet("me")]
  public async Task<IActionResult> Me()
  {
    var user = await _currentUserService.GetRequiredUserAsync();
    return Ok(new { user.Id, user.Email, user.DisplayName, user.TimedQuizBestStreak, user.TimedQuizTotalRuns });
  }

  [HttpPatch("settings")]
  public async Task<IActionResult> UpdateSettings([FromBody] UpdateSettingsDto dto)
  {
    var user = await _currentUserService.GetRequiredUserAsync();

    if (!string.IsNullOrWhiteSpace(dto.DisplayName))
      user.DisplayName = dto.DisplayName;

    var db = HttpContext.RequestServices.GetRequiredService<AppDbContext>();
    await db.SaveChangesAsync();

    return Ok(new { user.Id, user.Email, user.DisplayName, user.TimedQuizBestStreak, user.TimedQuizTotalRuns });
  }
}