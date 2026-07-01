namespace GymSystem.API.Models;

public class InBodyRecord
{
    public int Id { get; set; }
    public int TraineeId { get; set; }
    public Trainee Trainee { get; set; } = null!;
    public DateTime RecordDate { get; set; } = DateTime.UtcNow;

    public double Weight { get; set; }
    public double Height { get; set; }
    public double? BodyFatPercentage { get; set; }
    public double? MuscleMass { get; set; }
    public double? BMI { get; set; }
    public double? VisceralFat { get; set; }
    public double? WaterPercentage { get; set; }
    public double? BoneMass { get; set; }
    public string? Notes { get; set; }
    public string? AttachmentBase64 { get; set; } // image or PDF as base64
    public string? AttachmentType { get; set; }   // "image" or "pdf"
}
