namespace GymSystem.API.DTOs;

public record LoginRequest(string Email, string Password);

public record RegisterRequest(
    string FullName,
    string Email,
    string Password,
    string Role,
    string? Phone
);

public record AuthResponse(
    int Id,
    string FullName,
    string Email,
    string Role,
    string Token,
    string? ProfileImage
);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record RegisterTraineeRequest(
    string FullName,
    string Email,
    string Password,
    string? Phone
);
