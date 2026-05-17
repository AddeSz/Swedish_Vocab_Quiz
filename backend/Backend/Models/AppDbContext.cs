using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
  public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

  public DbSet<Word> Words { get; set; }
  public DbSet<User> Users { get; set; }
  public DbSet<UserWordProgress> UserWordProgresses { get; set; }

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    modelBuilder.Entity<UserWordProgress>().HasKey(p => new { p.UserId, p.WordId });
    modelBuilder.Entity<User>().HasIndex(u => u.GoogleSubject).IsUnique();
  }
}