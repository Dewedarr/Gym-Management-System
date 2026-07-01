using GymSystem.API.Data;
using GymSystem.API.DTOs;
using GymSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db) => _db = db;

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var totalUsers = await _db.Users.CountAsync(u => u.IsActive);
        var totalTrainees = await _db.Trainees.CountAsync();
        var totalCoaches = await _db.Coaches.CountAsync();
        var activeSubscriptions = await _db.TraineeSubscriptions.CountAsync(s => s.IsActive);

        return Ok(new
        {
            totalUsers,
            totalTrainees,
            totalCoaches,
            activeSubscriptions
        });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? role, [FromQuery] string? search)
    {
        var query = _db.Users.AsQueryable();

        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, true, out var r))
            query = query.Where(u => u.Role == r);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(u => u.FullName.Contains(search) || u.Email.Contains(search));

        var users = await query.Select(u => new
        {
            u.Id, u.FullName, u.Email, u.Phone,
            Role = u.Role.ToString(), u.IsActive, u.CreatedAt, u.ProfileImage
        }).ToListAsync();

        return Ok(users);
    }

    [HttpPut("users/{id}/toggle")]
    public async Task<IActionResult> ToggleUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsActive = !user.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new { message = user.IsActive ? "تم تفعيل الحساب" : "تم تعطيل الحساب" });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });

        // Cascade delete for Trainee
        var trainee = await _db.Trainees.FirstOrDefaultAsync(t => t.UserId == id);
        if (trainee != null)
        {
            _db.ChatMessages.RemoveRange(_db.ChatMessages.Where(m => m.TraineeId == trainee.Id));
            _db.InBodyRecords.RemoveRange(_db.InBodyRecords.Where(r => r.TraineeId == trainee.Id));
            _db.TraineeExercises.RemoveRange(_db.TraineeExercises.Where(e => e.TraineeId == trainee.Id));

            var nutritionPlans = _db.NutritionPlans.Where(n => n.TraineeId == trainee.Id);
            foreach (var plan in nutritionPlans)
                _db.NutritionMeals.RemoveRange(_db.NutritionMeals.Where(m => m.NutritionPlanId == plan.Id));
            _db.NutritionPlans.RemoveRange(nutritionPlans);

            _db.CoachingSessions.RemoveRange(_db.CoachingSessions.Where(s => s.TraineeId == trainee.Id));
            _db.TraineeSubscriptions.RemoveRange(_db.TraineeSubscriptions.Where(s => s.TraineeId == trainee.Id));

            // Detach trainee from coach
            var linkedTrainees = await _db.Trainees.Where(t => t.CoachId == trainee.CoachId && t.Id == trainee.Id).ToListAsync();
            _db.Trainees.Remove(trainee);
        }

        // Cascade delete for Coach
        var coach = await _db.Coaches.FirstOrDefaultAsync(c => c.UserId == id);
        if (coach != null)
        {
            // Unassign trainees from this coach
            var coachTrainees = await _db.Trainees.Where(t => t.CoachId == coach.Id).ToListAsync();
            foreach (var t in coachTrainees) t.CoachId = null;

            _db.CoachingSessions.RemoveRange(_db.CoachingSessions.Where(s => s.CoachId == coach.Id));
            _db.Coaches.Remove(coach);
        }

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return Ok(new { message = "User deleted successfully" });
    }

    [HttpGet("subscriptions")]
    public async Task<IActionResult> GetSubscriptions()
    {
        var subs = await _db.TraineeSubscriptions
            .Include(s => s.Trainee).ThenInclude(t => t.User)
            .Include(s => s.SubscriptionPlan)
            .OrderByDescending(s => s.StartDate)
            .Select(s => new
            {
                s.Id,
                TraineeName = s.Trainee.User.FullName,
                TraineeId = s.TraineeId,
                PlanName = s.SubscriptionPlan.Name,
                s.StartDate, s.EndDate,
                s.IsActive, s.PaidAmount,
                s.PaymentStatus, s.PaymentMethod, s.PaymentReference,
                s.RemainingSessionsThisMonth
            }).ToListAsync();

        return Ok(subs);
    }

    [HttpPut("subscriptions/{id}/status")]
    public async Task<IActionResult> UpdateSubscriptionStatus(int id, [FromBody] UpdateSubscriptionStatusRequest req)
    {
        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var sub = await _db.TraineeSubscriptions.FindAsync(id);
        if (sub == null) return NotFound(new { message = "الاشتراك غير موجود" });

        sub.IsActive = req.IsActive;
        sub.PaymentStatus = req.PaymentStatus;
        if (req.PaymentMethod.HasValue) sub.PaymentMethod = req.PaymentMethod;
        if (!string.IsNullOrEmpty(req.PaymentReference)) sub.PaymentReference = req.PaymentReference;

        if (req.RemainingSessionsThisMonth.HasValue)
            sub.RemainingSessionsThisMonth = req.RemainingSessionsThisMonth.Value;

        if (req.PaymentStatus == PaymentStatus.Paid && sub.PaymentConfirmedAt == null)
        {
            sub.PaymentConfirmedAt = DateTime.UtcNow;
            sub.ConfirmedByAdminId = adminId;
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تحديث الاشتراك ✅" });
    }

    [HttpDelete("subscriptions/{id}")]
    public async Task<IActionResult> DeleteSubscription(int id)
    {
        var sub = await _db.TraineeSubscriptions.FindAsync(id);
        if (sub == null) return NotFound(new { message = "الاشتراك غير موجود" });
        _db.TraineeSubscriptions.Remove(sub);
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم حذف الاشتراك" });
    }

    [HttpGet("subscription-plans")]
    public async Task<IActionResult> GetPlans() =>
        Ok(await _db.SubscriptionPlans.Where(p => p.IsActive).ToListAsync());

    [HttpPost("subscription-plans")]
    public async Task<IActionResult> CreatePlan([FromBody] SubscriptionPlan plan)
    {
        _db.SubscriptionPlans.Add(plan);
        await _db.SaveChangesAsync();
        return Ok(plan);
    }

    [HttpPut("subscription-plans/{id}")]
    public async Task<IActionResult> UpdatePlan(int id, [FromBody] SubscriptionPlan updated)
    {
        var plan = await _db.SubscriptionPlans.FindAsync(id);
        if (plan == null) return NotFound();

        plan.Name = updated.Name;
        plan.Price = updated.Price;
        plan.SessionsPerMonth = updated.SessionsPerMonth;
        plan.InBodySessionsPerMonth = updated.InBodySessionsPerMonth;
        plan.IncludesNutritionPlan = updated.IncludesNutritionPlan;
        plan.IncludesPrivateCoach = updated.IncludesPrivateCoach;
        plan.Features = updated.Features;

        await _db.SaveChangesAsync();
        return Ok(plan);
    }

    [HttpDelete("subscription-plans/{id}")]
    public async Task<IActionResult> DeletePlan(int id)
    {
        var plan = await _db.SubscriptionPlans.FindAsync(id);
        if (plan == null) return NotFound();
        plan.IsActive = false; // soft delete
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم حذف الباقة" });
    }

    [HttpGet("coaches")]
    public async Task<IActionResult> GetCoaches()
    {
        var coaches = await _db.Coaches
            .Include(c => c.User)
            .Include(c => c.Trainees)
            .Select(c => new
            {
                c.Id, c.UserId,
                FullName = c.User.FullName,
                Email = c.User.Email,
                Phone = c.User.Phone,
                c.Specialization,
                c.MaxPrivateTraineesPerMonth,
                c.PrivateSessionPrice,
                TraineesCount = c.Trainees.Count(t => t.TrainingStatus == TrainingStatus.Active),
                IsActive = c.User.IsActive
            }).ToListAsync();

        return Ok(coaches);
    }

    // ── Coaching Sessions ──────────────────────────────────────────────────
    [HttpGet("coaching-sessions")]
    public async Task<IActionResult> GetCoachingSessions([FromQuery] string? status = null)
    {
        var query = _db.CoachingSessions
            .Include(s => s.Trainee).ThenInclude(t => t.User)
            .Include(s => s.Coach).ThenInclude(c => c.User)
            .AsQueryable();

        if (status == "pending")
            query = query.Where(s => s.Status == SessionStatus.Pending);
        else if (status == "confirmed")
            query = query.Where(s => s.Status == SessionStatus.Confirmed);
        else if (status == "cancelled")
            query = query.Where(s => s.Status == SessionStatus.Cancelled);

        var sessions = await query
            .OrderByDescending(s => s.SessionDate)
            .Select(s => new
            {
                s.Id,
                s.SessionDate,
                s.Notes,
                s.Rating,
                s.Status,
                s.MarkedAt,
                s.ConfirmedAt,
                TraineeName = s.Trainee.User.FullName,
                TraineeId = s.TraineeId,
                CoachName = s.Coach.User.FullName,
                CoachId = s.CoachId,
                TrialSessionsUsed = s.Trainee.TrialSessionsUsed
            }).ToListAsync();

        return Ok(sessions);
    }

    [HttpPut("coaching-sessions/{id}/confirm")]
    public async Task<IActionResult> ConfirmSession(int id)
    {
        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var session = await _db.CoachingSessions
            .Include(s => s.Trainee)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session == null) return NotFound(new { message = "السيشن غير موجود" });
        if (session.Status != SessionStatus.Pending)
            return BadRequest(new { message = "السيشن ده اتعمل عليه إجراء بالفعل" });

        session.Status = SessionStatus.Confirmed;
        session.ConfirmedByAdminId = adminId;
        session.ConfirmedAt = DateTime.UtcNow;

        // Increment trial sessions used for the trainee
        session.Trainee.TrialSessionsUsed += 1;

        // Decrement remaining sessions from active subscription
        var activeSub = await _db.TraineeSubscriptions
            .Where(s => s.TraineeId == session.TraineeId && s.IsActive)
            .OrderByDescending(s => s.StartDate)
            .FirstOrDefaultAsync();
        if (activeSub != null && activeSub.RemainingSessionsThisMonth > 0)
            activeSub.RemainingSessionsThisMonth -= 1;

        await _db.SaveChangesAsync();
        return Ok(new
        {
            message = "تم تأكيد السيشن ✅",
            trialSessionsUsed = session.Trainee.TrialSessionsUsed
        });
    }

    [HttpPut("coaching-sessions/{id}/cancel")]
    public async Task<IActionResult> CancelSession(int id)
    {
        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var session = await _db.CoachingSessions.FirstOrDefaultAsync(s => s.Id == id);

        if (session == null) return NotFound(new { message = "السيشن غير موجود" });
        if (session.Status != SessionStatus.Pending)
            return BadRequest(new { message = "السيشن ده اتعمل عليه إجراء بالفعل" });

        session.Status = SessionStatus.Cancelled;
        session.ConfirmedByAdminId = adminId;
        session.ConfirmedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "تم إلغاء السيشن" });
    }

    [HttpPut("coaching-sessions/{id}/set-status")]
    public async Task<IActionResult> SetSessionStatus(int id, [FromBody] SetSessionStatusRequest req)
    {
        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var session = await _db.CoachingSessions
            .Include(s => s.Trainee)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session == null) return NotFound(new { message = "السيشن غير موجود" });

        var oldStatus = session.Status;
        session.Status = req.Status;
        session.ConfirmedByAdminId = adminId;
        session.ConfirmedAt = DateTime.UtcNow;

        var activeSub = await _db.TraineeSubscriptions
            .Where(s => s.TraineeId == session.TraineeId && s.IsActive)
            .OrderByDescending(s => s.StartDate)
            .FirstOrDefaultAsync();

        // If changing FROM confirmed TO something else → undo effects
        if (oldStatus == SessionStatus.Confirmed && req.Status != SessionStatus.Confirmed)
        {
            session.Trainee.TrialSessionsUsed = Math.Max(0, session.Trainee.TrialSessionsUsed - 1);
            if (activeSub != null)
                activeSub.RemainingSessionsThisMonth += 1;
        }

        // If changing TO confirmed FROM non-confirmed → apply effects
        if (oldStatus != SessionStatus.Confirmed && req.Status == SessionStatus.Confirmed)
        {
            session.Trainee.TrialSessionsUsed += 1;
            if (activeSub != null && activeSub.RemainingSessionsThisMonth > 0)
                activeSub.RemainingSessionsThisMonth -= 1;
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تحديث حالة السيشن ✅", trialSessionsUsed = session.Trainee.TrialSessionsUsed });
    }

    [HttpDelete("coaching-sessions/{id}")]
    public async Task<IActionResult> DeleteSession(int id)
    {
        var session = await _db.CoachingSessions
            .Include(s => s.Trainee)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session == null) return NotFound(new { message = "السيشن غير موجود" });

        // If it was confirmed, reverse its effects
        if (session.Status == SessionStatus.Confirmed)
        {
            session.Trainee.TrialSessionsUsed = Math.Max(0, session.Trainee.TrialSessionsUsed - 1);
            var activeSub = await _db.TraineeSubscriptions
                .Where(s => s.TraineeId == session.TraineeId && s.IsActive)
                .OrderByDescending(s => s.StartDate)
                .FirstOrDefaultAsync();
            if (activeSub != null)
                activeSub.RemainingSessionsThisMonth += 1;
        }

        _db.CoachingSessions.Remove(session);
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم حذف السيشن" });
    }

    // ── InBody ──────────────────────────────────────────────────────────────
    [HttpGet("trainees")]
    public async Task<IActionResult> GetAllTrainees()
    {
        var trainees = await _db.Trainees
            .Include(t => t.User)
            .Include(t => t.Coach).ThenInclude(c => c!.User)
            .OrderBy(t => t.User.FullName)
            .Select(t => new {
                t.Id,
                FullName = t.User.FullName,
                t.Weight, t.Height, t.FitnessGoal,
                CoachName = t.Coach != null ? t.Coach.User.FullName : null,
                InBodyCount = t.InBodyRecords.Count
            }).ToListAsync();
        return Ok(trainees);
    }

    [HttpGet("trainees/{traineeId}/inbody")]
    public async Task<IActionResult> GetTraineeInBody(int traineeId)
    {
        var records = await _db.InBodyRecords
            .Where(r => r.TraineeId == traineeId)
            .OrderByDescending(r => r.RecordDate)
            .Select(r => new {
                r.Id, r.RecordDate, r.Weight, r.Height, r.BMI,
                r.BodyFatPercentage, r.MuscleMass, r.VisceralFat,
                r.WaterPercentage, r.BoneMass, r.Notes,
                HasAttachment = r.AttachmentBase64 != null
            }).ToListAsync();
        return Ok(records);
    }

    [HttpGet("trainees/{traineeId}/inbody/{recordId}/attachment")]
    public async Task<IActionResult> GetInBodyAttachment(int traineeId, int recordId)
    {
        var record = await _db.InBodyRecords.FirstOrDefaultAsync(r => r.Id == recordId && r.TraineeId == traineeId);
        if (record == null) return NotFound();
        return Ok(new { record.AttachmentBase64, record.AttachmentType });
    }

    [HttpPost("trainees/{traineeId}/inbody")]
    public async Task<IActionResult> AddInBodyForTrainee(int traineeId, [FromBody] AdminInBodyRequest req)
    {
        var trainee = await _db.Trainees.FindAsync(traineeId);
        if (trainee == null) return NotFound(new { message = "المتدرب غير موجود" });

        double w = (double)req.Weight, h = (double)req.Height;
        var record = new InBodyRecord {
            TraineeId = traineeId,
            Weight = w, Height = h,
            BodyFatPercentage = req.BodyFatPercentage.HasValue ? (double?)req.BodyFatPercentage.Value : null,
            MuscleMass = req.MuscleMass.HasValue ? (double?)req.MuscleMass.Value : null,
            VisceralFat = req.VisceralFat.HasValue ? (double?)req.VisceralFat.Value : null,
            WaterPercentage = req.WaterPercentage.HasValue ? (double?)req.WaterPercentage.Value : null,
            BoneMass = req.BoneMass.HasValue ? (double?)req.BoneMass.Value : null,
            Notes = req.Notes,
            RecordDate = DateTime.UtcNow,
            BMI = h > 0 ? Math.Round(w / Math.Pow(h / 100.0, 2), 1) : 0
        };

        if (h > 0) { trainee.Height = h; }
        trainee.Weight = w;

        _db.InBodyRecords.Add(record);
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم إضافة القياس ✅" });
    }
}

public record AdminInBodyRequest(
    double Weight, double Height,
    double? BodyFatPercentage, double? MuscleMass,
    double? VisceralFat, double? WaterPercentage,
    double? BoneMass, string? Notes
);
