using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
  private readonly AppDbContext _db;
  private readonly CurrentUserService _currentUserService;
  private readonly string _allowedOrigin;

  public AuthController(AppDbContext db, CurrentUserService currentUserService, IConfiguration configuration)
  {
    _db = db;
    _currentUserService = currentUserService;
    _allowedOrigin = configuration["ALLOWED_ORIGIN"] ?? "http://localhost:5173";
  }

  [HttpPost("register")]
  public async Task<IActionResult> Register([FromBody] RegisterDto dto)
  {
    if (string.IsNullOrWhiteSpace(dto.Email) || !dto.Email.Contains('@'))
      return BadRequest("Invalid email.");

    if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 8)
      return BadRequest("Password must be at least 8 characters.");

    if (string.IsNullOrWhiteSpace(dto.DisplayName))
      return BadRequest("Display name is required.");

    var exists = await _db.Users.AnyAsync(u => u.Email == dto.Email);
    if (exists) return Conflict("Email already taken.");

    // Verification token logged to console in dev; in production this would be emailed
    var token = Guid.NewGuid().ToString();

    var user = new User
    {
      Id = Guid.NewGuid(),
      Email = dto.Email,
      DisplayName = dto.DisplayName,
      PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
      IsEmailVerified = false,
      EmailVerificationToken = token,
      CreatedAt = DateTime.UtcNow
    };

    _db.Users.Add(user);
    await _db.SaveChangesAsync();

    Console.WriteLine($"[VERIFY EMAIL] {dto.Email}: /verify-email?token={token}");

    return Ok();
  }

  [HttpGet("verify-email")]
  public async Task<IActionResult> VerifyEmail([FromQuery] string token)
  {
    if (string.IsNullOrWhiteSpace(token))
      return BadRequest("Token is required.");

    var user = await _db.Users.FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
    if (user is null) return BadRequest("Invalid token.");

    user.IsEmailVerified = true;
    user.EmailVerificationToken = null;
    await _db.SaveChangesAsync();

    return Ok();
  }

  [HttpPost("login")]
  public async Task<IActionResult> Login([FromBody] LoginDto dto)
  {
    var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

    // Null PasswordHash means this is a Google-only account; reject password login
    if (user is null || user.PasswordHash is null)
      return Unauthorized("Invalid credentials.");

    if (!user.IsEmailVerified)
      return StatusCode(403, "Email not verified.");

    if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
      return Unauthorized("Invalid credentials.");

    // Store internal user ID (not Google subject) as the claim for consistent identity across auth methods
    var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, user.Id.ToString()) };
    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
    var principal = new ClaimsPrincipal(identity);

    await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);

    return Ok(new { user.Id, user.Email, user.DisplayName, user.TimedQuizBestStreak, user.TimedQuizTotalRuns });
  }

  [HttpGet("login")]
  public IActionResult GoogleLogin([FromQuery] string? returnUrl)
  {
    var redirectUrl = _allowedOrigin;

    // Only allow redirects to the same host as the configured origin to prevent open redirect
    if (!string.IsNullOrEmpty(returnUrl)
        && Uri.TryCreate(returnUrl, UriKind.Absolute, out var uri)
        && Uri.TryCreate(_allowedOrigin, UriKind.Absolute, out var allowedUri)
        && uri.Host == allowedUri.Host)
    {
      redirectUrl = returnUrl;
    }

    return Challenge(new AuthenticationProperties { RedirectUri = redirectUrl }, "Google");
  }

  [HttpGet("me")]
  public async Task<IActionResult> Me()
  {
    if (!User.Identity?.IsAuthenticated ?? true)
      return Unauthorized();

    try
    {
      var user = await _currentUserService.GetRequiredUserAsync();
      return Ok(new { user.Id, user.Email, user.DisplayName, user.TimedQuizBestStreak, user.TimedQuizTotalRuns });
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

  [HttpPatch("settings")]
  public async Task<IActionResult> UpdateSettings([FromBody] UpdateSettingsDto dto)
  {
    if (!User.Identity?.IsAuthenticated ?? true)
      return Unauthorized();

    var user = await _currentUserService.GetRequiredUserAsync();

    if (!string.IsNullOrWhiteSpace(dto.DisplayName))
      user.DisplayName = dto.DisplayName;

    await _db.SaveChangesAsync();

    return Ok(new { user.Id, user.Email, user.DisplayName, user.TimedQuizBestStreak, user.TimedQuizTotalRuns });
  }
}