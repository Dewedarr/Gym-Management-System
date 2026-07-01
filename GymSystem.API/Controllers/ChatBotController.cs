using GymSystem.API.Data;
using GymSystem.API.Models;
using GymSystem.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GymSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Trainee,Admin")]
public class ChatBotController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ChatBotService _bot;

    public ChatBotController(AppDbContext db, ChatBotService bot)
    {
        _db = db;
        _bot = bot;
    }

    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] AskRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var user = await _db.Users.FindAsync(userId);
        var trainee = await _db.Trainees
            .Include(t => t.User)
            .Include(t => t.ActiveSubscription).ThenInclude(s => s!.SubscriptionPlan)
            .Include(t => t.InBodyRecords.OrderByDescending(r => r.RecordDate).Take(1))
            .FirstOrDefaultAsync(t => t.UserId == userId);

        string? context = null;
        if (trainee != null)
        {
            var sub = trainee.ActiveSubscription;
            var inbody = trainee.InBodyRecords.FirstOrDefault();

            // Coach name
            string? coachName = null;
            if (trainee.CoachId.HasValue)
            {
                var coach = await _db.Coaches.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == trainee.CoachId);
                coachName = coach?.User?.FullName;
            }

            // Confirmed sessions this month
            var now = DateTime.UtcNow;
            var confirmedSessions = await _db.CoachingSessions.CountAsync(s =>
                s.TraineeId == trainee.Id && s.Status == SessionStatus.Confirmed &&
                s.SessionDate.Year == now.Year && s.SessionDate.Month == now.Month);

            var lines = new List<string>
            {
                $"الاسم: {user?.FullName}",
                $"الجنس: {trainee.Gender}",
                $"العمر: {trainee.Age} سنة",
                $"الطول: {trainee.Height} سم",
                $"الوزن: {trainee.Weight} كجم",
                $"الهدف الرياضي: {trainee.FitnessGoal}",
            };

            if (coachName != null)
                lines.Add($"الكوتش المسؤول: {coachName}");

            if (sub != null)
            {
                lines.Add($"الاشتراك الحالي: {sub.SubscriptionPlan?.Name}");
                lines.Add($"تاريخ انتهاء الاشتراك: {sub.EndDate:dd/MM/yyyy}");
                lines.Add($"السيشنز المؤكدة هذا الشهر: {confirmedSessions} من أصل {sub.SubscriptionPlan?.SessionsPerMonth}");
            }

            if (inbody != null)
            {
                lines.Add($"آخر قياس InBody: وزن {inbody.Weight} كجم, دهون {inbody.BodyFatPercentage}%, كتلة عضلية {inbody.MuscleMass} كجم, BMI {inbody.BMI}");
            }

            if (!string.IsNullOrEmpty(trainee.TrainingStartDate?.ToString()))
                lines.Add($"تاريخ بدء التدريب: {trainee.TrainingStartDate:dd/MM/yyyy}");

            context = string.Join("\n", lines);
        }

        var response = await _bot.AskAsync(req.Message, context);

        if (trainee != null)
        {
            _db.ChatMessages.Add(new ChatMessage
            {
                TraineeId = trainee.Id,
                Message = req.Message,
                Response = response
            });
            await _db.SaveChangesAsync();
        }

        return Ok(new { response });
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var trainee = await _db.Trainees.FirstOrDefaultAsync(t => t.UserId == userId);
        if (trainee == null) return Ok(new List<object>());

        var history = await _db.ChatMessages
            .Where(m => m.TraineeId == trainee.Id)
            .OrderByDescending(m => m.SentAt)
            .Take(50)
            .Select(m => new { m.Message, m.Response, m.SentAt })
            .ToListAsync();

        return Ok(history);
    }
}

public record AskRequest(string Message);
