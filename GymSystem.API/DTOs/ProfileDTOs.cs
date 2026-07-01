using System.ComponentModel.DataAnnotations;

namespace GymSystem.API.DTOs;

public record UpdateUserProfileRequest(
    [Required(ErrorMessage = "الاسم مطلوب")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "الاسم بين 2 و 100 حرف")]
    string FullName,

    [Phone(ErrorMessage = "رقم الهاتف غير صحيح")]
    [RegularExpression(@"^01[0125][0-9]{8}$", ErrorMessage = "يجب أن يكون رقم هاتف مصري صحيح (01x-xxxxxxxx)")]
    string? Phone,

    string? Address,
    string? Bio,
    string? ProfileImageBase64
);

public record UpdateTraineeBodyRequest(
    [Range(100, 250, ErrorMessage = "الطول يجب أن يكون بين 100 و 250 سم")]
    double? Height,

    [Range(20, 300, ErrorMessage = "الوزن يجب أن يكون بين 20 و 300 كجم")]
    double? Weight,

    [Range(5, 100, ErrorMessage = "العمر يجب أن يكون بين 5 و 100 سنة")]
    int? Age,

    string? Gender,
    string? FitnessGoal,
    int? CoachId,
    int? TrainingDurationMonths
);

public record UpdateCoachSettingsRequest(
    string? Specialization,
    string? Bio,

    [Range(1, 100, ErrorMessage = "الحد الأقصى بين 1 و 100 متدرب")]
    int MaxPrivateTraineesPerMonth,

    [Range(0, 100000, ErrorMessage = "السعر يجب أن يكون رقم موجب")]
    decimal PrivateSessionPrice
);

public record PaymentRequest(
    int SubscriptionId,
    string PaymentMethod,

    [StringLength(100, ErrorMessage = "مرجع الدفع لا يتجاوز 100 حرف")]
    string? PaymentReference
);

public record ConfirmPaymentRequest(
    int SubscriptionId,
    bool IsApproved,
    string? AdminNote
);

public record GymContactInfo(
    string Phone,
    string WhatsApp,
    string Address,
    string GoogleMapsUrl,
    string WorkingHours,
    string Email,
    string InstaPay,
    string VodafoneCash
);
