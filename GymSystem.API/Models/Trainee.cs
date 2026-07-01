namespace GymSystem.API.Models;

public enum TrainingStatus { Active = 0, Completed = 1, Paused = 2 }

public class Trainee
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int? CoachId { get; set; }
    public Coach? Coach { get; set; }
    public DateTime? TrainingStartDate { get; set; }
    public DateTime? TrainingEndDate { get; set; }
    public int? TrainingDurationMonths { get; set; }

    public double? Height { get; set; }
    public double? Weight { get; set; }
    public int? Age { get; set; }
    public string? Gender { get; set; }
    public string? FitnessGoal { get; set; }

    public int TrialSessionsUsed { get; set; } = 0; // max 2, then coach is locked
    public TrainingStatus TrainingStatus { get; set; } = TrainingStatus.Active;

    public ICollection<InBodyRecord> InBodyRecords { get; set; } = new List<InBodyRecord>();
    public ICollection<NutritionPlan> NutritionPlans { get; set; } = new List<NutritionPlan>();
    public ICollection<TraineeExercise> TraineeExercises { get; set; } = new List<TraineeExercise>();
    public ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
    public TraineeSubscription? ActiveSubscription { get; set; }
}
