using GymSystem.API.Data;
using GymSystem.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GymSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProfileController(AppDbContext db) => _db = db;

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPut("update")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { message = "البيانات غير صحيحة", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });

        var user = await _db.Users.FindAsync(CurrentUserId);
        if (user == null) return NotFound();

        // Check phone uniqueness if changed
        if (!string.IsNullOrEmpty(req.Phone) && req.Phone != user.Phone)
        {
            if (await _db.Users.AnyAsync(u => u.Phone == req.Phone && u.Id != CurrentUserId))
                return BadRequest(new { message = "رقم الهاتف مستخدم بالفعل" });
        }

        user.FullName = req.FullName;
        user.Phone = req.Phone;
        user.Address = req.Address;
        user.Bio = req.Bio;

        if (!string.IsNullOrEmpty(req.ProfileImageBase64))
        {
            if (req.ProfileImageBase64.Length > 5_000_000)
                return BadRequest(new { message = "حجم الصورة كبير جداً (الحد الأقصى 5MB)" });
            user.ProfileImage = req.ProfileImageBase64;
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تحديث البروفايل بنجاح", profileImage = user.ProfileImage });
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var user = await _db.Users
            .Include(u => u.TraineeProfile).ThenInclude(t => t!.Coach).ThenInclude(c => c!.User)
            .FirstOrDefaultAsync(u => u.Id == CurrentUserId);
        if (user == null) return NotFound();

        object? traineeExtra = null;
        if (user.TraineeProfile != null)
        {
            var t = user.TraineeProfile;
            traineeExtra = new
            {
                t.Height, t.Weight, t.Age, t.Gender, t.FitnessGoal,
                CoachId = t.CoachId,
                CoachName = t.Coach?.User?.FullName,
                t.TrainingDurationMonths,
                t.TrialSessionsUsed
            };
        }

        return Ok(new
        {
            user.Id, user.FullName, user.Email, user.Phone,
            user.ProfileImage, user.Address, user.Bio,
            Role = user.Role.ToString(), user.CreatedAt,
            TraineeData = traineeExtra
        });
    }

    [HttpPut("coach-settings")]
    [Authorize(Roles = "Coach")]
    public async Task<IActionResult> UpdateCoachSettings([FromBody] UpdateCoachSettingsRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { message = "البيانات غير صحيحة", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });

        var coach = await _db.Coaches.FirstOrDefaultAsync(c => c.UserId == CurrentUserId);
        if (coach == null) return NotFound();

        coach.Specialization = req.Specialization;
        coach.Bio = req.Bio;
        coach.MaxPrivateTraineesPerMonth = req.MaxPrivateTraineesPerMonth;
        coach.PrivateSessionPrice = req.PrivateSessionPrice;

        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تحديث إعدادات الكوتش" });
    }

    [HttpPut("trainee-body")]
    [Authorize(Roles = "Trainee")]
    public async Task<IActionResult> UpdateTraineeBody([FromBody] UpdateTraineeBodyRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { message = "البيانات غير صحيحة", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });

        var trainee = await _db.Trainees.FirstOrDefaultAsync(t => t.UserId == CurrentUserId);
        if (trainee == null) return NotFound();

        if (req.CoachId.HasValue)
        {
            var coach = await _db.Coaches.FindAsync(req.CoachId.Value);
            if (coach == null) return BadRequest(new { message = "الكوتش غير موجود" });

            var currentMonth = DateTime.UtcNow.Month;
            var slots = await _db.Trainees.CountAsync(t =>
                t.CoachId == req.CoachId.Value &&
                t.TrainingStartDate.HasValue &&
                t.TrainingStartDate.Value.Month == currentMonth);

            if (slots >= coach.MaxPrivateTraineesPerMonth && trainee.CoachId != req.CoachId)
                return BadRequest(new { message = "الكوتش وصل للحد الأقصى من المتدربين هذا الشهر" });

            if (trainee.CoachId != req.CoachId.Value)
            {
                trainee.CoachId = req.CoachId.Value;
                trainee.TrainingStartDate = DateTime.UtcNow;
                trainee.TrainingDurationMonths = req.TrainingDurationMonths;
                if (req.TrainingDurationMonths.HasValue)
                    trainee.TrainingEndDate = DateTime.UtcNow.AddMonths(req.TrainingDurationMonths.Value);
            }
        }

        if (req.Height.HasValue) trainee.Height = req.Height;
        if (req.Weight.HasValue) trainee.Weight = req.Weight;
        if (req.Age.HasValue) trainee.Age = req.Age;
        if (!string.IsNullOrEmpty(req.Gender)) trainee.Gender = req.Gender;
        if (!string.IsNullOrEmpty(req.FitnessGoal)) trainee.FitnessGoal = req.FitnessGoal;

        await _db.SaveChangesAsync();
        return Ok(new { message = "تم تحديث البيانات" });
    }
}
