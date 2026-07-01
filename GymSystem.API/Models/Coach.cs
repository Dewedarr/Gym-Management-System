namespace GymSystem.API.Models;

public class Coach
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string? Specialization { get; set; }
    public string? Bio { get; set; }
    public int MaxPrivateTraineesPerMonth { get; set; } = 10;
    public decimal PrivateSessionPrice { get; set; }

    public ICollection<Trainee> Trainees { get; set; } = new List<Trainee>();
    public ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();
}
