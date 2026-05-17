using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

var allowedOrigin = builder.Configuration["ALLOWED_ORIGIN"] ?? "http://localhost:5173";

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";

builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

builder.Services.AddCors(options =>
{
  options.AddDefaultPolicy(policy =>
  {
    policy.WithOrigins(allowedOrigin).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
  });
});

builder.Services
  .AddAuthentication(options =>
  {
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = "Google";
  })
  .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
  {
    options.Cookie.HttpOnly = true;

    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

    options.ExpireTimeSpan = TimeSpan.FromDays(30);
    options.SlidingExpiration = true;
  })
  .AddGoogle("Google", options =>
  {
    options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;

    options.ClientId = builder.Configuration["Google:ClientId"] ?? throw new InvalidOperationException("Google ClientId missing.");

    options.ClientSecret = builder.Configuration["Google:ClientSecret"] ?? throw new InvalidOperationException("Google ClientSecret missing.");

    options.CallbackPath = "/signin-google";

    options.Events.OnCreatingTicket = async context =>
    {
      var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();

      var principal = context.Principal;

      var googleSubject = principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

      if (string.IsNullOrWhiteSpace(googleSubject))
      {
        throw new Exception("Google subject claim missing.");
      }

      var email = principal?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "";

      var displayName = principal?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "";

      var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleSubject == googleSubject);

      if (user is null)
      {
        user = new User
        {
          Id = Guid.NewGuid(),
          GoogleSubject = googleSubject,
          Email = email,
          DisplayName = displayName,
          CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
      }
      else
      {
        user.Email = email;
        user.DisplayName = displayName;
      }

      await db.SaveChangesAsync();

      var identity = (System.Security.Claims.ClaimsIdentity)principal!.Identity!;

      var existingClaim = identity.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);

      if (existingClaim is not null)
      {
        identity.RemoveClaim(existingClaim);
      }

      identity.AddClaim(new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, user.Id.ToString()));
    };
  });

builder.Services.AddAuthorization();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CurrentUserService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
  var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

  if (app.Environment.IsDevelopment())
  {
    db.Database.Migrate();
  }
}

if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
  app.UseHttpsRedirection();
}

app.UseRouting();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();