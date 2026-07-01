namespace GymSystem.API.Models;

public class CoachingSession
{
    public int Id { get; set; }
    public int TraineeId { get; set; }
    public Trainee Trainee { get; set; } = null!;
    public int CoachId { get; set; }
    public Coach Coach { get; set; } = null!;

    public DateTime SessionDate { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
    public int Rating { get; set; } = 5; // 1-5

    // Coach marks it
    public bool MarkedByCoach { get; set; } = false;
    public DateTime? MarkedAt { get; set; }

    // Admin confirms or cancels
    public SessionStatus Status { get; set; } = SessionStatus.Pending;
    public int? ConfirmedByAdminId { get; set; }
    public DateTime? ConfirmedAt { get; set; }
}

public enum SessionStatus
{
    Pending = 0,    // Coach marked, waiting admin
    Confirmed = 1,  // Admin confirmed → counts as trial session
    Cancelled = 2   // Admin cancelled → doesn't count
}
