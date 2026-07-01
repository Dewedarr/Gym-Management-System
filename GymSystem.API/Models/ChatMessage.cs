namespace GymSystem.API.Models;

public class ChatMessage
{
    public int Id { get; set; }
    public int TraineeId { get; set; }
    public Trainee Trainee { get; set; } = null!;
    public string Message { get; set; } = "";
    public string Response { get; set; } = "";
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
