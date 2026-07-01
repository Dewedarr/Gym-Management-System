using GymSystem.API.Data;
using GymSystem.API.DTOs;
using GymSystem.API.Helpers;
using GymSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GymSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Trainee,Admin")]
public class TraineeController : ControllerBase
{
    private readonly AppDbContext _db;

    public TraineeController(AppDbContext db) => _db = db;

    private async Task<Trainee?> GetMyTrainee()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return await _db.Trainees.FirstOrDefaultAsync(t => t.UserId == userId);
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var trainee = await GetMyTrainee();
        if (trainee == null) return NotFound();

        var user = await _db.Users.FindAsync(trainee.UserId);
        var coach = trainee.CoachId.HasValue
            ? await _db.Coaches.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == trainee.CoachId)
            : null;

        return Ok(new TraineeProfileDto(
            trainee.Id, trainee.UserId, user!.FullName, user.Email, user.Phone, user.ProfileImage,
            trainee.CoachId, coach?.User.FullName,
            trainee.Height, trainee.Weight, trainee.Age, trainee.Gender, trainee.FitnessGoal,
            trainee.TrainingStartDate, trainee.TrainingEndDate, trainee.TrainingDurationMonths
        ));
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateTraineeProfileRequest req)
    {
        var trainee = await GetMyTrainee();
        if (trainee == null) return NotFound();

        if (req.CoachId.HasValue)
        {
            var coach = await _db.Coaches.FindAsync(req.CoachId.Value);
            if (coach == null) return BadRequest(new { message = "الكوتش غير موجود" });

            var slots = await _db.Trainees.CountAsync(t =>
                t.CoachId == req.CoachId.Value &&
                t.TrainingStartDate.HasValue &&
                t.TrainingStartDate.Value.Month == DateTime.UtcNow.Month);

            if (slots >= coach.MaxPrivateTraineesPerMonth)
                return BadRequest(new { message = "الكوتش وصل للحد الأقصى من المتدربين هذا الشهر" });

            trainee.CoachId = req.CoachId;
            trainee.TrainingStartDate = DateTime.UtcNow;
            trainee.TrainingDurationMonths = req.TrainingDurationMonths;
            if (req.TrainingDurationMonths.HasValue)
                trainee.TrainingEndDate = DateTime.UtcNow.AddMonths(req.TrainingDurationMonths.Value);
        }

        trainee.Height = req.Height ?? trainee.Height;
        trainee.Weight = req.Weight ?? trainee.Weight;
        trainee.Age = req.Age ?? trainee.Age;
        trainee.Gender = req.Gender ?? trainee.Gender;
        trainee.FitnessGoal = req.FitnessGoal ?? trainee.FitnessGoal;

        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تحديث البروفايل" });
    }

    [HttpGet("coaches")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailableCoaches()
    {
        var coaches = await _db.Coaches
            .Include(c => c.User)
            .Include(c => c.Trainees)
            .Where(c => c.User.IsActive)
            .Select(c => new
            {
                c.Id,
                FullName = c.User.FullName,
                c.Specialization,
                c.Bio,
                ProfileImage = c.User.ProfileImage,
                c.MaxPrivateTraineesPerMonth,
                c.PrivateSessionPrice,
                CurrentTrainees = c.Trainees.Count(t => t.TrainingStatus == TrainingStatus.Active),
                IsAvailable = c.Trainees.Count(t => t.TrainingStatus == TrainingStatus.Active) < c.MaxPrivateTraineesPerMonth
            }).ToListAsync();

        return Ok(coaches);
    }

    // InBody
    [HttpPost("inbody")]
    public async Task<IActionResult> AddInBody([FromBody] CreateInBodyRequest req)
    {
        var trainee = await GetMyTrainee();
        if (trainee == null) return NotFound();

        var bmi = BodyCalculator.CalcBMI(req.Weight, req.Height);
        var age = trainee.Age ?? 25;
        var gender = trainee.Gender ?? "male";

        var bodyFat = req.BodyFatPercentage ?? BodyCalculator.EstimateBodyFat(bmi, age, gender);

        if (req.AttachmentBase64 != null && req.AttachmentBase64.Length > 5_000_000)
            return BadRequest(new { message = "حجم الملف كبير جداً (الحد الأقصى 5MB)" });

        var record = new InBodyRecord
        {
            TraineeId = trainee.Id,
            Weight = req.Weight,
            Height = req.Height,
            BodyFatPercentage = bodyFat,
            MuscleMass = req.MuscleMass,
            BMI = bmi,
            VisceralFat = req.VisceralFat,
            WaterPercentage = req.WaterPercentage,
            BoneMass = req.BoneMass,
            Notes = req.Notes,
            AttachmentBase64 = req.AttachmentBase64,
            AttachmentType = req.AttachmentType
        };

        trainee.Weight = req.Weight;
        trainee.Height = req.Height;

        _db.InBodyRecords.Add(record);
        await _db.SaveChangesAsync();

        return Ok(record);
    }

    [HttpGet("inbody")]
    public async Task<IActionResult> GetInBodyHistory()
    {
        var trainee = await GetMyTrainee();
        if (trainee == null) return NotFound();

        var records = await _db.InBodyRecords
            .Where(r => r.TraineeId == trainee.Id)
            .OrderByDescending(r => r.RecordDate)
            .ToListAsync();

        return Ok(records);
    }

    [HttpPut("inbody/{id}")]
    public async Task<IActionResult> UpdateInBody(int id, [FromBody] CreateInBodyRequest req)
    {
        var trainee = await GetMyTrainee();
        if (trainee == null) return NotFound();

        var record = await _db.InBodyRecords.FirstOrDefaultAsync(r => r.Id == id && r.TraineeId == trainee.Id);
        if (record == null) return NotFound(new { message = "Record not found" });

        if (req.AttachmentBase64 != null && req.AttachmentBase64.Length > 5_000_000)
            return BadRequest(new { message = "File too large (max 5MB)" });

        var bmi = BodyCalculator.CalcBMI(req.Weight, req.Height);
        var age = trainee.Age ?? 25;
        var gender = trainee.Gender ?? "male";
        var bodyFat = req.BodyFatPercentage ?? BodyCalculator.EstimateBodyFat(bmi, age, gender);

        record.Weight = req.Weight;
        record.Height = req.Height;
        record.BMI = bmi;
        record.BodyFatPercentage = bodyFat;
        record.MuscleMass = req.MuscleMass;
        record.VisceralFat = req.VisceralFat;
        record.WaterPercentage = req.WaterPercentage;
        record.BoneMass = req.BoneMass;
        record.Notes = req.Notes;
        if (req.AttachmentBase64 != null)
        {
            record.AttachmentBase64 = req.AttachmentBase64;
            record.AttachmentType = req.AttachmentType;
        }

        trainee.Weight = req.Weight;
        trainee.Height = req.Height;

        await _db.SaveChangesAsync();
        return Ok(record);
    }

    [HttpDelete("inbody/{id}")]
    public async Task<IActionResult> DeleteInBody(int id)
    {
        var trainee = await GetMyTrainee();
        if (trainee == null) return NotFound();

        var record = await _db.InBodyRecords.FirstOrDefaultAsync(r => r.Id == id && r.TraineeId == trainee.Id);
        if (record == null) return NotFound(new { message = "Record not found" });

        _db.InBodyRecords.Remove(record);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Record deleted" });
    }

    [HttpGet("body-stats")]
    public async Task<IActionResult> GetBodyStats()
    {
        var trainee = await GetMyTrainee();
        if (trainee == null) return NotFound();

        if (!trainee.Height.HasValue || !trainee.Weight.HasValue)
            return BadRequest(new { message = "يرجى إدخال الطول والوزن أولاً" });

        var age = trainee.Age ?? 25;
        var gender = trainee.Gender ?? "male";
        var goal = trainee.FitnessGoal ?? "maintain";

        var bmi = BodyCalculator.CalcBMI(trainee.Weight.Value, trainee.Height.Value);
        var bodyFat = BodyCalculator.EstimateBodyFat(bmi, age, gender);
        var calories = BodyCalculator.DailyCalories(trainee.Weight.Value, trainee.Height.Value, age, gender, goal);
        var (protein, carbs, fats) = BodyCalculator.MacroSplit(calories, goal);

        return Ok(new BodyStatsResult(
            bmi,
            BodyCalculator.BMICategory(bmi),
            bodyFat,
            BodyCalculator.BodyFatCategory(bodyFat, gender),
            BodyCalculator.IdealWeight(trainee.Height.Value, gender),
            calories, protein, carbs, fats
        ));
    }

    [HttpGet("nutrition-plans")]
    public async Task<IActionResult> GetNutritionPlans()
    {
        var trainee = await GetMyTrainee();
        if (trainee == null) return NotFound();

        var gymSettings = await _db.GymSettings.FindAsync(1);
        var gymName = gymSettings?.GymName ?? "GymPro";

        var plans = await _db.NutritionPlans
            .Where(n => n.TraineeId == trainee.Id)
            .Include(n => n.Meals)
            .Include(n => n.Coach).ThenInclude(c => c!.User)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        var result = plans.Select(n => new NutritionPlanDto(
            n.Id, n.Title, n.Description, n.IsAutoGenerated,
            n.Coach != null ? n.Coach.User.FullName : gymName,
            n.CreatedAt,
            n.Meals.Select(m => new MealDto(m.Id, m.MealName, m.Time, m.Foods, m.Calories, m.Protein, m.Carbs, m.Fats)).ToList(),
            n.AttachmentBase64,
            n.AttachmentType
        )).ToList();

        return Ok(result);
    }

    [HttpGet("exercises")]
    public async Task<IActionResult> GetMyExercises()
    {
        var trainee = await GetMyTrainee();
        if (trainee == null) return NotFound();

        var exercises = await _db.TraineeExercises
            .Where(te => te.TraineeId == trainee.Id)
            .Include(te => te.Exercise)
            .Select(te => new
            {
                te.Id, te.Day, te.IsCompleted, te.AssignedAt,
                Exercise = new {
                    te.Exercise.Id, te.Exercise.Name, te.Exercise.Description,
                    te.Exercise.MuscleGroup, te.Exercise.MediaType,
                    te.Exercise.Sets, te.Exercise.Reps, te.Exercise.Duration,
                    HasMedia = te.Exercise.MediaUrl != null && te.Exercise.MediaUrl.Length > 0,
                    MediaUrl = te.Exercise.MediaUrl != null && !te.Exercise.MediaUrl.StartsWith("data:") ? te.Exercise.MediaUrl : null
                }
            }).ToListAsync();

        return Ok(exercises);
    }

    [HttpGet("exercises/{exerciseId}/media")]
    public async Task<IActionResult> GetExerciseMedia(int exerciseId)
    {
        var trainee = await GetMyTrainee();
        if (trainee == null) return NotFound();
        // Verify this exercise is assigned to the trainee
        var te = await _db.TraineeExercises
            .Include(x => x.Exercise)
            .FirstOrDefaultAsync(x => x.Exercise.Id == exerciseId && x.TraineeId == trainee.Id);
        if (te == null) return NotFound();
        return Ok(new { te.Exercise.MediaUrl, te.Exercise.MediaType });
    }

    [HttpPut("exercises/{assignId}/complete")]
    public async Task<IActionResult> MarkComplete(int assignId)
    {
        var trainee = await GetMyTrainee();
        var te = await _db.TraineeExercises.FirstOrDefaultAsync(x => x.Id == assignId && x.TraineeId == trainee!.Id);
        if (te == null) return NotFound();
        te.IsCompleted = !te.IsCompleted;
        await _db.SaveChangesAsync();
        return Ok(new { isCompleted = te.IsCompleted });
    }

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] SubscribeRequest req)
    {
        var trainee = await GetMyTrainee();
        if (trainee == null) return NotFound();

        var plan = await _db.SubscriptionPlans.FindAsync(req.SubscriptionPlanId);
        if (plan == null) return NotFound(new { message = "الباقة غير موجودة" });

        // For private coaching, coach is required
        if (plan.IncludesPrivateCoach && req.CoachId == null)
            return BadRequest(new { message = "يجب اختيار كوتش لباقة التدريب البرايفت" });

        var existing = await _db.TraineeSubscriptions.FirstOrDefaultAsync(s => s.TraineeId == trainee.Id && s.IsActive);
        if (existing != null) existing.IsActive = false;

        // Assign coach if private coaching
        if (plan.IncludesPrivateCoach && req.CoachId.HasValue)
        {
            var coach = await _db.Coaches.FindAsync(req.CoachId.Value);
            if (coach == null) return NotFound(new { message = "الكوتش غير موجود" });
            var currentCount = await _db.Trainees.CountAsync(t => t.CoachId == coach.Id && t.Id != trainee.Id);
            if (currentCount >= coach.MaxPrivateTraineesPerMonth)
                return BadRequest(new { message = "الكوتش مكتمل، اختر كوتشاً آخر" });
            trainee.CoachId = req.CoachId;
            trainee.TrialSessionsUsed = 0; // reset trial on new subscription
        }

        var sub = new TraineeSubscription
        {
            TraineeId = trainee.Id,
            SubscriptionPlanId = plan.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddMonths(plan.DurationMonths),
            RemainingSessionsThisMonth = plan.SessionsPerMonth ?? 0,
            RemainingInBodySessions = plan.InBodySessionsPerMonth ?? 0,
            PaidAmount = plan.Price
        };

        _db.TraineeSubscriptions.Add(sub);

        // Reactivate trainee training status when they subscribe again
        trainee.TrainingStatus = TrainingStatus.Active;

        await _db.SaveChangesAsync();

        return Ok(new { message = $"تم الاشتراك في باقة {plan.Name} بنجاح" });
    }

    [HttpPut("change-coach")]
    public async Task<IActionResult> ChangeCoach([FromBody] ChangeCoachRequest req)
    {
        var trainee = await _db.Trainees
            .Include(t => t.ActiveSubscription).ThenInclude(s => s!.SubscriptionPlan)
            .FirstOrDefaultAsync(t => t.UserId == int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!));
        if (trainee == null) return NotFound();

        if (trainee.TrialSessionsUsed >= 2)
            return BadRequest(new { message = "Trial sessions ended. You cannot change your coach anymore." });

        if (req.CoachId.HasValue)
        {
            var coach = await _db.Coaches.FindAsync(req.CoachId.Value);
            if (coach == null) return NotFound(new { message = "الكوتش غير موجود" });
            var currentCount = await _db.Trainees.CountAsync(t => t.CoachId == coach.Id && t.Id != trainee.Id);
            if (currentCount >= coach.MaxPrivateTraineesPerMonth)
                return BadRequest(new { message = "الكوتش مكتمل، اختر كوتشاً آخر" });
        }

        trainee.CoachId = req.CoachId;
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تغيير الكوتش بنجاح", trialSessionsUsed = trainee.TrialSessionsUsed });
    }

    [HttpGet("subscription")]
    public async Task<IActionResult> GetMySubscription()
    {
        var trainee = await GetMyTrainee();
        if (trainee == null) return NotFound();

        var sub = await _db.TraineeSubscriptions
            .Include(s => s.SubscriptionPlan)
            .FirstOrDefaultAsync(s => s.TraineeId == trainee.Id && s.IsActive);

        if (sub == null) return Ok(null);

        // Count ALL confirmed sessions for this trainee under this subscription
        var confirmedCount = await _db.CoachingSessions.CountAsync(s =>
            s.TraineeId == trainee.Id &&
            s.Status == SessionStatus.Confirmed);

        var sessionsPerMonth = sub.SubscriptionPlan?.SessionsPerMonth ?? 0;
        var durationMonths  = sub.SubscriptionPlan?.DurationMonths  ?? 1;
        var totalAllowed    = sessionsPerMonth * durationMonths;
        var remaining       = Math.Max(0, totalAllowed - confirmedCount);

        if (sub.RemainingSessionsThisMonth != remaining)
        {
            sub.RemainingSessionsThisMonth = remaining;
            await _db.SaveChangesAsync();
        }

        return Ok(sub);
    }
}
