using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
  private readonly CurrentUserService _currentUserService;
  private readonly string _allowedOrigin;

  public AuthController(CurrentUserService currentUserService, IConfiguration configuration)
  {
    _currentUserService = currentUserService;
    _allowedOrigin = configuration["ALLOWED_ORIGIN"] ?? "http://localhost:5173";
  }

  [HttpGet("login")]
  public IActionResult Login([FromQuery] string? returnUrl)
  {
    var redirectUrl = _allowedOrigin;

    if (!string.IsNullOrEmpty(returnUrl)
        && Uri.TryCreate(returnUrl, UriKind.Absolute, out var uri)
        && Uri.TryCreate(_allowedOrigin, UriKind.Absolute, out var allowedUri)
        && uri.Host == allowedUri.Host)
    {
      redirectUrl = returnUrl;
    }

    return Challenge(new AuthenticationProperties
    {
      RedirectUri = redirectUrl,
    }, "Google");
  }

  [HttpGet("me")]
  public async Task<IActionResult> Me()
  {
    if (!User.Identity?.IsAuthenticated ?? true)
      return Unauthorized();

    try
    {
      var user = await _currentUserService.GetRequiredUserAsync();
      return Ok(new
      {
        user.Id,
        user.Email,
        user.DisplayName,
        user.TimedQuizBestStreak,
        user.TimedQuizTotalRuns,
      });
    }
    catch (UnauthorizedAccessException)
    {
      return Unauthorized();
    }
  }

  [HttpGet("logout")]
  public async Task<IActionResult> Logout()
  {
    await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Ok();
  }
}