namespace GymSystem.API.DTOs;

public record CoachProfileDto(
    int Id,
    int UserId,
    string FullName,
    string Email,
    string? Phone,
    string? ProfileImage,
    string? Specialization,
    string? Bio,
    int MaxPrivateTraineesPerMonth,
    decimal PrivateSessionPrice,
    int CurrentTraineesCount
);

public record UpdateCoachProfileRequest(
    string? Specialization,
    string? Bio,
    int MaxPrivateTraineesPerMonth,
    decimal PrivateSessionPrice
);

public record ExerciseDto(
    int Id,
    string Name,
    string? Description,
    string? MuscleGroup,
    string? MediaUrl,
    string MediaType,
    string? Sets,
    string? Reps,
    string? Duration
);

public record CreateExerciseRequest(
    string Name,
    string? Description,
    string? MuscleGroup,
    string? MediaUrl,
    string MediaType,
    string? Sets,
    string? Reps,
    string? Duration
);

public record AssignExerciseRequest(
    int TraineeId,
    int ExerciseId,
    string? Day
);

public record UpdateSubscriptionStatusRequest(
    bool IsActive,
    GymSystem.API.Models.PaymentStatus PaymentStatus,
    GymSystem.API.Models.PaymentMethod? PaymentMethod = null,
    string? PaymentReference = null,
    int? RemainingSessionsThisMonth = null
);

public record UpdateDayRequest(string? Day);
public record SetSessionStatusRequest(GymSystem.API.Models.SessionStatus Status);

public record MarkSessionRequest(
    int TraineeId,
    string? Notes,
    int Rating = 5,
    DateTime? SessionDate = null
);
