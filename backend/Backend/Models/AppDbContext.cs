using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
  public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

  public DbSet<Word> Words { get; set; }
  public DbSet<User> Users { get; set; }
  public DbSet<UserWordProgress> UserWordProgresses { get; set; }

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    // Composite key: one progress record per user-word pair
    modelBuilder.Entity<UserWordProgress>().HasKey(p => new { p.UserId, p.WordId });
    modelBuilder.Entity<User>().HasIndex(u => u.Auth0Subject).IsUnique();
    modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
  }
}