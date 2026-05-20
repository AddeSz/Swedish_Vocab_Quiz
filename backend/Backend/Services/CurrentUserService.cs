using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

// Resolves the authenticated user from the cookie's NameIdentifier claim.
// Both Google OAuth and email/password login store the internal User.Id as this claim,
// so this service works uniformly regardless of auth method.
public class CurrentUserService
{
  private readonly IHttpContextAccessor _httpContextAccessor;
  private readonly AppDbContext _db;

  public CurrentUserService(
      IHttpContextAccessor httpContextAccessor,
      AppDbContext db)
  {
    _httpContextAccessor = httpContextAccessor;
    _db = db;
  }

  public async Task<User> GetRequiredUserAsync()
  {
    var userIdValue = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    if (!Guid.TryParse(userIdValue, out var userId))
    {
      throw new UnauthorizedAccessException();
    }

    var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);

    if (user is null)
    {
      throw new UnauthorizedAccessException();
    }

    return user;
  }
}