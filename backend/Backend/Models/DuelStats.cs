using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class DuelStats
{
  [Key]
  [ForeignKey("User")]
  public Guid UserId { get; set; }
  public User User { get; set; } = null!;
  public int Wins { get; set; } = 0;
  public int Ties { get; set; } = 0;
  public int Losses { get; set; } = 0;
}
