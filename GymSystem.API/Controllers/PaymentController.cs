using GymSystem.API.Data;
using GymSystem.API.DTOs;
using GymSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GymSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly AppDbContext _db;

    public PaymentController(AppDbContext db) => _db = db;

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Trainee: Submit payment proof
    [HttpPost("submit")]
    [Authorize(Roles = "Trainee")]
    public async Task<IActionResult> SubmitPayment([FromBody] PaymentRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { message = "البيانات غير صحيحة", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });

        if (!Enum.TryParse<PaymentMethod>(req.PaymentMethod, true, out var method))
            return BadRequest(new { message = "طريقة الدفع غير صحيحة" });

        var sub = await _db.TraineeSubscriptions
            .Include(s => s.Trainee)
            .FirstOrDefaultAsync(s => s.Id == req.SubscriptionId && s.Trainee.UserId == CurrentUserId);

        if (sub == null)
            return NotFound(new { message = "الاشتراك غير موجود" });

        if (sub.PaymentStatus == PaymentStatus.Paid)
            return BadRequest(new { message = "تم تأكيد الدفع مسبقاً" });

        sub.PaymentMethod = method;
        sub.PaymentReference = req.PaymentReference;
        sub.PaymentStatus = PaymentStatus.Pending;

        await _db.SaveChangesAsync();
        return Ok(new { message = "تم إرسال بيانات الدفع. انتظر تأكيد الإدمن." });
    }

    // Admin: Get pending payments
    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPendingPayments()
    {
        var payments = await _db.TraineeSubscriptions
            .Include(s => s.Trainee).ThenInclude(t => t.User)
            .Include(s => s.SubscriptionPlan)
            .Where(s => s.PaymentStatus == PaymentStatus.Pending && s.PaymentMethod.HasValue)
            .OrderByDescending(s => s.StartDate)
            .Select(s => new
            {
                s.Id,
                TraineeName = s.Trainee.User.FullName,
                TraineePhone = s.Trainee.User.Phone,
                PlanName = s.SubscriptionPlan.Name,
                s.PaidAmount,
                PaymentMethod = s.PaymentMethod.ToString(),
                s.PaymentReference,
                s.StartDate
            }).ToListAsync();

        return Ok(payments);
    }

    // Admin: Confirm or reject payment
    [HttpPost("confirm")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentRequest req)
    {
        var sub = await _db.TraineeSubscriptions.FindAsync(req.SubscriptionId);
        if (sub == null) return NotFound();

        sub.PaymentStatus = req.IsApproved ? PaymentStatus.Paid : PaymentStatus.Rejected;
        sub.IsActive = req.IsApproved;

        if (req.IsApproved)
        {
            sub.PaymentConfirmedAt = DateTime.UtcNow;
            sub.ConfirmedByAdminId = CurrentUserId;
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = req.IsApproved ? "تم تأكيد الدفع وتفعيل الاشتراك ✅" : "تم رفض الدفع" });
    }

    // Admin: Manual payment assignment
    [HttpPost("manual-confirm")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ManualConfirm([FromBody] ManualPaymentRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { message = "البيانات غير صحيحة", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });

        var trainee = await _db.Trainees.FirstOrDefaultAsync(t => t.UserId == req.UserId);
        if (trainee == null) return NotFound(new { message = "المستخدم غير موجود" });

        var plan = await _db.SubscriptionPlans.FindAsync(req.PlanId);
        if (plan == null) return NotFound(new { message = "الباقة غير موجودة" });

        // Deactivate existing subscription
        var existing = await _db.TraineeSubscriptions.FirstOrDefaultAsync(s => s.TraineeId == trainee.Id && s.IsActive);
        if (existing != null) existing.IsActive = false;

        var sub = new TraineeSubscription
        {
            TraineeId = trainee.Id,
            SubscriptionPlanId = plan.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddMonths(plan.DurationMonths),
            RemainingSessionsThisMonth = plan.SessionsPerMonth ?? 0,
            RemainingInBodySessions = plan.InBodySessionsPerMonth ?? 0,
            PaidAmount = plan.Price,
            PaymentStatus = PaymentStatus.Paid,
            PaymentMethod = PaymentMethod.Cash,
            PaymentConfirmedAt = DateTime.UtcNow,
            ConfirmedByAdminId = CurrentUserId,
            IsActive = true
        };

        _db.TraineeSubscriptions.Add(sub);
        await _db.SaveChangesAsync();

        return Ok(new { message = "تم تسجيل الدفع وتفعيل الاشتراك بنجاح" });
    }

    // Public: Get active subscription plans
    [HttpGet("plans")]
    public async Task<IActionResult> GetPlans() =>
        Ok(await _db.SubscriptionPlans.Where(p => p.IsActive).OrderBy(p => p.Price).ToListAsync());

    // Public: Get gym info (without heavy base64 hero image)
    [HttpGet("gym-info")]
    public async Task<IActionResult> GetGymInfo()
    {
        var settings = await _db.GymSettings.FindAsync(1);
        if (settings == null) return NotFound();

        // Return heroImageBase64 only if it's a URL (not heavy base64)
        var heroMedia = settings.HeroImageBase64;
        if (heroMedia != null && heroMedia.StartsWith("data:"))
            heroMedia = null; // don't send base64 here — use /gym-hero endpoint instead

        return Ok(new
        {
            settings.GymName, settings.Phone, settings.WhatsApp,
            settings.Address, settings.GoogleMapsUrl, settings.WorkingHours,
            settings.Email, settings.InstaPay, settings.VodafoneCash,
            settings.LogoBase64,
            HeroImageBase64 = heroMedia,
            settings.HeroTitle, settings.HeroSubtitle,
            settings.GalleryImagesJson, settings.BranchesJson,
            settings.YearsExperience, settings.AboutText
        });
    }

    // Separate endpoint for heavy hero image (base64)
    [HttpGet("gym-hero")]
    public async Task<IActionResult> GetGymHero()
    {
        var settings = await _db.GymSettings.FindAsync(1);
        if (settings == null) return NotFound();
        return Ok(new { settings.HeroImageBase64 });
    }

    // Admin: Update gym settings
    [HttpPut("gym-settings")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateGymSettings([FromBody] GymSettingsRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { message = "البيانات غير صحيحة", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });

        var settings = await _db.GymSettings.FindAsync(1);
        if (settings == null) return NotFound();

        settings.GymName = req.GymName ?? settings.GymName;
        settings.Phone = req.Phone ?? settings.Phone;
        settings.WhatsApp = req.WhatsApp ?? settings.WhatsApp;
        settings.Address = req.Address ?? settings.Address;
        settings.GoogleMapsUrl = req.GoogleMapsUrl ?? settings.GoogleMapsUrl;
        settings.WorkingHours = req.WorkingHours ?? settings.WorkingHours;
        settings.Email = req.Email ?? settings.Email;
        settings.InstaPay = req.InstaPay ?? settings.InstaPay;
        settings.VodafoneCash = req.VodafoneCash ?? settings.VodafoneCash;
        if (req.LogoBase64 != null) settings.LogoBase64 = req.LogoBase64.Length > 0 ? req.LogoBase64 : null;
        if (req.HeroImageBase64 != null) settings.HeroImageBase64 = req.HeroImageBase64.Length > 0 ? req.HeroImageBase64 : null;
        if (req.HeroTitle != null) settings.HeroTitle = req.HeroTitle;
        if (req.HeroSubtitle != null) settings.HeroSubtitle = req.HeroSubtitle;
        if (req.GalleryImagesJson != null) settings.GalleryImagesJson = req.GalleryImagesJson;
        if (req.BranchesJson != null) settings.BranchesJson = req.BranchesJson;
        if (req.YearsExperience.HasValue) settings.YearsExperience = req.YearsExperience.Value;
        if (req.AboutText != null) settings.AboutText = req.AboutText;

        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تحديث إعدادات الجيم" });
    }
}

public record ManualPaymentRequest(
    int UserId,
    int PlanId
);

public record GymSettingsRequest(
    string? GymName,
    string? Phone,
    string? WhatsApp,
    string? Address,
    string? GoogleMapsUrl,
    string? WorkingHours,
    string? Email,
    string? InstaPay,
    string? VodafoneCash,
    string? LogoBase64,
    string? HeroImageBase64,
    string? HeroTitle,
    string? HeroSubtitle,
    string? GalleryImagesJson,
    string? BranchesJson,
    int? YearsExperience,
    string? AboutText
);
