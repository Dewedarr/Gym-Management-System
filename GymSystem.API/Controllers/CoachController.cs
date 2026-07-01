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
[Authorize(Roles = "Coach,Admin")]
public class CoachController : ControllerBase
{
    private readonly AppDbContext _db;

    public CoachController(AppDbContext db) => _db = db;

    private async Task<Coach?> GetMyCoach()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return await _db.Coaches.FirstOrDefaultAsync(c => c.UserId == userId);
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        var count = await _db.Trainees.CountAsync(t => t.CoachId == coach.Id && t.TrainingStatus == TrainingStatus.Active);
        var user = await _db.Users.FindAsync(coach.UserId);

        return Ok(new CoachProfileDto(
            coach.Id, coach.UserId, user!.FullName, user.Email, user.Phone, user.ProfileImage,
            coach.Specialization, coach.Bio, coach.MaxPrivateTraineesPerMonth,
            coach.PrivateSessionPrice, count
        ));
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateCoachProfileRequest req)
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        coach.Specialization = req.Specialization;
        coach.Bio = req.Bio;
        coach.MaxPrivateTraineesPerMonth = req.MaxPrivateTraineesPerMonth;
        coach.PrivateSessionPrice = req.PrivateSessionPrice;
        await _db.SaveChangesAsync();

        return Ok(new { message = "تم تحديث البروفايل" });
    }

    [HttpGet("trainees")]
    public async Task<IActionResult> GetMyTrainees()
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        var trainees = await _db.Trainees
            .Where(t => t.CoachId == coach.Id)
            .Include(t => t.User)
            .Include(t => t.ActiveSubscription).ThenInclude(s => s!.SubscriptionPlan)
            .Select(t => new
            {
                t.Id, t.UserId,
                FullName = t.User.FullName,
                Email = t.User.Email,
                Phone = t.User.Phone,
                t.Height, t.Weight, t.Age, t.Gender, t.FitnessGoal,
                t.TrainingStartDate, t.TrainingEndDate,
                TrainingStatus = t.TrainingStatus.ToString(),
                SubscriptionPlan = t.ActiveSubscription != null ? t.ActiveSubscription.SubscriptionPlan.Name : null
            }).ToListAsync();

        return Ok(trainees);
    }

    [HttpGet("trainees/{traineeId}")]
    public async Task<IActionResult> GetTraineeDetail(int traineeId)
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        var trainee = await _db.Trainees
            .Where(t => t.Id == traineeId && t.CoachId == coach.Id)
            .Include(t => t.User)
            .Include(t => t.TraineeExercises).ThenInclude(te => te.Exercise)
            .FirstOrDefaultAsync();

        if (trainee == null) return NotFound(new { message = "المتدرب غير موجود أو لا يتبع كوتشك" });

        return Ok(new {
            trainee.Id, trainee.UserId,
            FullName = trainee.User.FullName,
            trainee.Height, trainee.Weight, trainee.FitnessGoal,
            TraineeExercises = trainee.TraineeExercises.Select(te => new {
                te.Id, te.Day, te.IsCompleted,
                Exercise = new {
                    te.Exercise.Id, te.Exercise.Name, te.Exercise.Description,
                    te.Exercise.MuscleGroup, te.Exercise.MediaType,
                    te.Exercise.Sets, te.Exercise.Reps, te.Exercise.Duration,
                    HasMedia = te.Exercise.MediaUrl != null && te.Exercise.MediaUrl.Length > 0,
                    MediaUrl = te.Exercise.MediaUrl != null && !te.Exercise.MediaUrl.StartsWith("data:") ? te.Exercise.MediaUrl : null
                }
            }).ToList()
        });
    }

    // Exercises
    [HttpGet("exercises")]
    public async Task<IActionResult> GetExercises()
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        var exercises = await _db.Exercises
            .Where(e => e.CoachId == coach.Id)
            .Select(e => new {
                e.Id, e.Name, e.Description, e.MuscleGroup,
                e.MediaType, e.Sets, e.Reps, e.Duration,
                HasMedia = e.MediaUrl != null && e.MediaUrl.Length > 0,
                // Only return URL if it's a real URL (not base64), else null
                MediaUrl = e.MediaUrl != null && !e.MediaUrl.StartsWith("data:") ? e.MediaUrl : null
            }).ToListAsync();

        return Ok(exercises);
    }

    [HttpGet("exercises/{id}/media")]
    public async Task<IActionResult> GetExerciseMedia(int id)
    {
        var coach = await GetMyCoach();
        var ex = await _db.Exercises.FirstOrDefaultAsync(e => e.Id == id && e.CoachId == coach!.Id);
        if (ex == null) return NotFound();
        return Ok(new { ex.MediaUrl, ex.MediaType });
    }

    [HttpPost("exercises")]
    public async Task<IActionResult> CreateExercise([FromBody] CreateExerciseRequest req)
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        var ex = new Exercise
        {
            CoachId = coach.Id,
            Name = req.Name,
            Description = req.Description,
            MuscleGroup = req.MuscleGroup,
            MediaUrl = req.MediaUrl,
            MediaType = req.MediaType,
            Sets = req.Sets,
            Reps = req.Reps,
            Duration = req.Duration
        };

        _db.Exercises.Add(ex);
        await _db.SaveChangesAsync();
        return Ok(new ExerciseDto(ex.Id, ex.Name, ex.Description, ex.MuscleGroup, ex.MediaUrl, ex.MediaType, ex.Sets, ex.Reps, ex.Duration));
    }

    [HttpDelete("exercises/{id}")]
    public async Task<IActionResult> DeleteExercise(int id)
    {
        var coach = await GetMyCoach();
        var ex = await _db.Exercises.FirstOrDefaultAsync(e => e.Id == id && e.CoachId == coach!.Id);
        if (ex == null) return NotFound();
        _db.Exercises.Remove(ex);
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم حذف التمرين" });
    }

    [HttpPost("assign-exercise")]
    public async Task<IActionResult> AssignExercise([FromBody] AssignExerciseRequest req)
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        var trainee = await _db.Trainees.FirstOrDefaultAsync(t => t.Id == req.TraineeId && t.CoachId == coach.Id);
        if (trainee == null) return NotFound(new { message = "المتدرب غير موجود" });

        var exercise = await _db.Exercises.FirstOrDefaultAsync(e => e.Id == req.ExerciseId && e.CoachId == coach.Id);
        if (exercise == null) return NotFound(new { message = "التمرين غير موجود" });

        _db.TraineeExercises.Add(new TraineeExercise
        {
            TraineeId = req.TraineeId,
            ExerciseId = req.ExerciseId,
            Day = req.Day
        });

        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تعيين التمرين للمتدرب" });
    }

    [HttpDelete("trainee-exercises/{id}")]
    public async Task<IActionResult> RemoveTraineeExercise(int id)
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();
        var te = await _db.TraineeExercises
            .Include(x => x.Trainee)
            .FirstOrDefaultAsync(x => x.Id == id && x.Trainee.CoachId == coach.Id);
        if (te == null) return NotFound(new { message = "التعيين غير موجود" });
        _db.TraineeExercises.Remove(te);
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم حذف التمرين من برنامج المتدرب" });
    }

    [HttpPut("trainee-exercises/{id}/day")]
    public async Task<IActionResult> UpdateTraineeExerciseDay(int id, [FromBody] UpdateDayRequest req)
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();
        var te = await _db.TraineeExercises
            .Include(x => x.Trainee)
            .FirstOrDefaultAsync(x => x.Id == id && x.Trainee.CoachId == coach.Id);
        if (te == null) return NotFound(new { message = "التعيين غير موجود" });
        te.Day = req.Day;
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تحديث اليوم" });
    }

    // Nutrition Plans
    [HttpPost("nutrition-plan")]
    public async Task<IActionResult> CreateNutritionPlan([FromBody] CreateNutritionPlanRequest req)
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        var trainee = await _db.Trainees.FirstOrDefaultAsync(t => t.Id == req.TraineeId && t.CoachId == coach.Id);
        if (trainee == null) return NotFound(new { message = "المتدرب غير موجود" });

        var plan = new NutritionPlan
        {
            TraineeId = req.TraineeId,
            CoachId = coach.Id,
            Title = req.Title,
            Description = req.Description,
            AttachmentBase64 = req.AttachmentBase64,
            AttachmentType = req.AttachmentType,
            Meals = req.Meals.Select(m => new NutritionMeal
            {
                MealName = m.MealName, Time = m.Time, Foods = m.Foods,
                Calories = m.Calories, Protein = m.Protein, Carbs = m.Carbs, Fats = m.Fats
            }).ToList()
        };

        _db.NutritionPlans.Add(plan);
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم إنشاء خطة التغذية", planId = plan.Id });
    }

    [HttpGet("nutrition-plans/{traineeId}")]
    public async Task<IActionResult> GetNutritionPlans(int traineeId)
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        var trainee = await _db.Trainees.FirstOrDefaultAsync(t => t.Id == traineeId && t.CoachId == coach.Id);
        if (trainee == null) return NotFound(new { message = "المتدرب غير موجود" });

        var plans = await _db.NutritionPlans
            .Where(n => n.TraineeId == traineeId && n.CoachId == coach.Id)
            .Include(n => n.Meals)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new {
                n.Id, n.Title, n.Description, n.AttachmentBase64, n.AttachmentType, n.CreatedAt,
                Meals = n.Meals.Select(m => new {
                    m.Id, m.MealName, m.Time, m.Foods, m.Calories, m.Protein, m.Carbs, m.Fats
                }).ToList()
            }).ToListAsync();

        return Ok(plans);
    }

    [HttpPut("nutrition-plan/{id}")]
    public async Task<IActionResult> UpdateNutritionPlan(int id, [FromBody] CreateNutritionPlanRequest req)
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        var plan = await _db.NutritionPlans.Include(n => n.Meals)
            .FirstOrDefaultAsync(n => n.Id == id && n.CoachId == coach.Id);
        if (plan == null) return NotFound(new { message = "الخطة غير موجودة" });

        plan.Title = req.Title;
        plan.Description = req.Description;
        if (req.AttachmentBase64 != null) plan.AttachmentBase64 = req.AttachmentBase64;
        if (req.AttachmentType != null) plan.AttachmentType = req.AttachmentType;

        _db.NutritionMeals.RemoveRange(plan.Meals);
        plan.Meals = req.Meals.Select(m => new NutritionMeal {
            MealName = m.MealName, Time = m.Time, Foods = m.Foods,
            Calories = m.Calories, Protein = m.Protein, Carbs = m.Carbs, Fats = m.Fats
        }).ToList();

        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تعديل الخطة ✅" });
    }

    [HttpDelete("nutrition-plan/{id}")]
    public async Task<IActionResult> DeleteNutritionPlan(int id)
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        var plan = await _db.NutritionPlans.Include(n => n.Meals)
            .FirstOrDefaultAsync(n => n.Id == id && n.CoachId == coach.Id);
        if (plan == null) return NotFound(new { message = "الخطة غير موجودة" });

        _db.NutritionPlans.Remove(plan);
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم حذف الخطة" });
    }

    // ── Coaching Sessions ──────────────────────────────────────────────────
    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions()
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        var sessions = await _db.CoachingSessions
            .Where(s => s.CoachId == coach.Id)
            .Include(s => s.Trainee).ThenInclude(t => t.User)
            .OrderByDescending(s => s.SessionDate)
            .Select(s => new
            {
                s.Id, s.SessionDate, s.Notes, s.Rating, s.Status,
                s.MarkedAt, s.ConfirmedAt,
                TraineeName = s.Trainee.User.FullName,
                TraineeId = s.TraineeId
            }).ToListAsync();

        return Ok(sessions);
    }

    [HttpPost("sessions/mark")]
    public async Task<IActionResult> MarkSession([FromBody] MarkSessionRequest req)
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        // Verify trainee belongs to this coach
        var trainee = await _db.Trainees.FirstOrDefaultAsync(t => t.Id == req.TraineeId && t.CoachId == coach.Id);
        if (trainee == null) return NotFound(new { message = "المتدرب غير موجود أو لا يتبع كوتشك" });

        var sessionDate = req.SessionDate?.Date ?? DateTime.UtcNow.Date;

        // Check session date is within active subscription period
        var activeSub = await _db.TraineeSubscriptions
            .FirstOrDefaultAsync(s => s.TraineeId == req.TraineeId && s.IsActive);
        if (activeSub == null)
            return BadRequest(new { message = "المتدرب ليس لديه اشتراك فعال" });
        if (sessionDate < activeSub.StartDate.Date || sessionDate > activeSub.EndDate.Date)
            return BadRequest(new { message = $"التاريخ خارج فترة الاشتراك ({activeSub.StartDate:dd/MM/yyyy} → {activeSub.EndDate:dd/MM/yyyy})" });

        // Check remaining sessions using stored counter
        if (activeSub.RemainingSessionsThisMonth <= 0)
            return BadRequest(new { message = $"انتهت السيشنز المتاحة في هذا الاشتراك" });

        // Check if already marked for same date
        var existing = await _db.CoachingSessions.AnyAsync(s =>
            s.TraineeId == req.TraineeId && s.CoachId == coach.Id &&
            s.SessionDate.Date == sessionDate);
        if (existing) return BadRequest(new { message = "تم تسجيل سيشن لهذا المتدرب في نفس اليوم بالفعل" });

        var session = new CoachingSession
        {
            TraineeId = req.TraineeId,
            CoachId = coach.Id,
            SessionDate = sessionDate,
            Notes = req.Notes,
            Rating = req.Rating,
            MarkedByCoach = true,
            MarkedAt = DateTime.UtcNow,
            Status = SessionStatus.Pending
        };

        _db.CoachingSessions.Add(session);
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تسجيل الحضور — في انتظار تأكيد الأدمن", sessionId = session.Id });
    }

    // ── InBody ──────────────────────────────────────────────────────────────
    [HttpGet("trainees/{traineeId}/inbody")]
    public async Task<IActionResult> GetTraineeInBody(int traineeId)
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        var trainee = await _db.Trainees.FirstOrDefaultAsync(t => t.Id == traineeId && t.CoachId == coach.Id);
        if (trainee == null) return NotFound(new { message = "المتدرب غير موجود أو لا يتبع كوتشك" });

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

    [HttpPost("trainees/{traineeId}/inbody")]
    public async Task<IActionResult> AddInBodyForTrainee(int traineeId, [FromBody] AdminInBodyRequest req)
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        var trainee = await _db.Trainees.FirstOrDefaultAsync(t => t.Id == traineeId && t.CoachId == coach.Id);
        if (trainee == null) return NotFound(new { message = "المتدرب غير موجود أو لا يتبع كوتشك" });

        double w = req.Weight, h = req.Height;
        var record = new InBodyRecord {
            TraineeId = traineeId,
            Weight = w, Height = h,
            BodyFatPercentage = req.BodyFatPercentage,
            MuscleMass = req.MuscleMass,
            VisceralFat = req.VisceralFat,
            WaterPercentage = req.WaterPercentage,
            BoneMass = req.BoneMass, Notes = req.Notes,
            RecordDate = DateTime.UtcNow,
            BMI = h > 0 ? Math.Round(w / Math.Pow(h / 100.0, 2), 1) : 0
        };

        if (h > 0) { trainee.Height = h; }
        trainee.Weight = w;

        _db.InBodyRecords.Add(record);
        await _db.SaveChangesAsync();
        return Ok(new { message = "تم إضافة القياس ✅" });
    }

    [HttpGet("available-trainees-slots")]
    public async Task<IActionResult> CheckSlots()
    {
        var coach = await GetMyCoach();
        if (coach == null) return NotFound();

        var activeCount = await _db.Trainees.CountAsync(t => t.CoachId == coach.Id && t.TrainingStatus == TrainingStatus.Active);

        return Ok(new
        {
            max = coach.MaxPrivateTraineesPerMonth,
            current = activeCount,
            available = Math.Max(0, coach.MaxPrivateTraineesPerMonth - activeCount)
        });
    }
}
