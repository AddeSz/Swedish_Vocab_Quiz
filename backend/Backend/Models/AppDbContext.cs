using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Word> Words { get; set; }
    public DbSet<WordForm> WordForms { get; set; }
    public DbSet<Definition> Definitions { get; set; }
    public DbSet<Example> Examples { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<UserWordProgress> UserWordProgresses { get; set; }
    public DbSet<DuelStats> DuelStats { get; set; }
    public DbSet<DuelHistory> DuelHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserWordProgress>().HasKey(p => new { p.UserId, p.WordId });
        modelBuilder.Entity<User>().HasIndex(u => u.Auth0Subject).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<DuelStats>().HasKey(d => d.UserId);
        
        modelBuilder.Entity<DuelHistory>(entity =>
        {
            entity.HasOne(h => h.Player1)
                  .WithMany()
                  .HasForeignKey(h => h.Player1UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(h => h.Player2)
                  .WithMany()
                  .HasForeignKey(h => h.Player2UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}