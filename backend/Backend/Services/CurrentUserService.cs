using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

public class CurrentUserService
{
  private readonly IHttpContextAccessor _httpContextAccessor;
  private readonly AppDbContext _db;

  public CurrentUserService(IHttpContextAccessor httpContextAccessor, AppDbContext db)
  {
    _httpContextAccessor = httpContextAccessor;
    _db = db;
  }

  public async Task<User> GetRequiredUserAsync()
  {
    var principal = _httpContextAccessor.HttpContext?.User;
    var sub = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    if (string.IsNullOrEmpty(sub))
      throw new UnauthorizedAccessException();

    var user = await _db.Users.FirstOrDefaultAsync(u => u.Auth0Subject == sub);

    if (user is null)
    {
      var email = principal!.FindFirst("https://ordforrad-api/email")?.Value
                  ?? principal!.FindFirst(ClaimTypes.Email)?.Value
                  ?? "";
      var name = principal!.FindFirst("https://ordforrad-api/name")?.Value
                 ?? principal!.FindFirst(ClaimTypes.Name)?.Value
                 ?? email;

      user = new User
      {
        Id = Guid.NewGuid(),
        Auth0Subject = sub,
        Email = email,
        DisplayName = name,
        CreatedAt = DateTime.UtcNow
      };

      _db.Users.Add(user);
      await _db.SaveChangesAsync();
    }

    return user;
  }
}
