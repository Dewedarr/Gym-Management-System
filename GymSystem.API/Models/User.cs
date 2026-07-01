namespace GymSystem.API.Models;

public enum UserRole { Admin, Coach, Trainee }

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public UserRole Role { get; set; }
    public string? Phone { get; set; }
    public string? ProfileImage { get; set; }
    public string? Address { get; set; }
    public string? Bio { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Coach? CoachProfile { get; set; }
    public Trainee? TraineeProfile { get; set; }
}
