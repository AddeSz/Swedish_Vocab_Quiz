using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
  public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

  public DbSet<Word> Words { get; set; }
  public DbSet<Sentence> Sentences { get; set; }
  public DbSet<WordSentence> WordSentences { get; set; }
  public DbSet<UserWordProgress> UserWordProgresses { get; set; }

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    modelBuilder.Entity<WordSentence>().HasKey(ws => new { ws.WordId, ws.SentenceId });

    modelBuilder.Entity<UserWordProgress>().HasKey(p => new { p.UserId, p.WordId });
  }
}