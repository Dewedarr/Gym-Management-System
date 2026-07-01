namespace GymSystem.API.Models;

public class Exercise
{
    public int Id { get; set; }
    public int CoachId { get; set; }
    public Coach Coach { get; set; } = null!;
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? MuscleGroup { get; set; }
    public string? MediaUrl { get; set; }
    public string MediaType { get; set; } = "image";
    public string? Sets { get; set; }
    public string? Reps { get; set; }
    public string? Duration { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TraineeExercise> TraineeExercises { get; set; } = new List<TraineeExercise>();
}

public class TraineeExercise
{
    public int Id { get; set; }
    public int TraineeId { get; set; }
    public Trainee Trainee { get; set; } = null!;
    public int ExerciseId { get; set; }
    public Exercise Exercise { get; set; } = null!;
    public string? Day { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
