namespace GymSystem.API.Models;

public enum SubscriptionType { Regular, Premium, PrivateCoaching }
public enum PaymentMethod { Cash, VodafoneCash, InstaPay }
public enum PaymentStatus { Pending, Paid, Rejected }

public class SubscriptionPlan
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public SubscriptionType Type { get; set; }
    public decimal Price { get; set; }
    public int DurationMonths { get; set; } = 1;
    public int? SessionsPerMonth { get; set; }
    public int? InBodySessionsPerMonth { get; set; }
    public bool IncludesNutritionPlan { get; set; } = false;
    public bool IncludesPrivateCoach { get; set; } = false;
    public string? Features { get; set; }
    public bool IsActive { get; set; } = true;
}

public class TraineeSubscription
{
    public int Id { get; set; }
    public int TraineeId { get; set; }
    public Trainee Trainee { get; set; } = null!;
    public int SubscriptionPlanId { get; set; }
    public SubscriptionPlan SubscriptionPlan { get; set; } = null!;
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime EndDate { get; set; }
    public int RemainingSessionsThisMonth { get; set; }
    public int RemainingInBodySessions { get; set; }
    public bool IsActive { get; set; } = true;
    public decimal PaidAmount { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public PaymentMethod? PaymentMethod { get; set; }
    public string? PaymentReference { get; set; }
    public DateTime? PaymentConfirmedAt { get; set; }
    public int? ConfirmedByAdminId { get; set; }
}
