using GymSystem.API.Data;
using GymSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GymSystem.API.Services;

public class SubscriptionResetService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<SubscriptionResetService> _logger;

    public SubscriptionResetService(IServiceProvider services, ILogger<SubscriptionResetService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Run immediately on startup, then every 24 hours
        while (!stoppingToken.IsCancellationRequested)
        {
            await RunAsync();
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    private async Task RunAsync()
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTime.UtcNow;
        var today = now.Date;

        // 1. Deactivate expired subscriptions + mark trainee as Completed
        var expired = await db.TraineeSubscriptions
            .Include(s => s.Trainee)
            .Include(s => s.SubscriptionPlan)
            .Where(s => s.IsActive && s.EndDate.Date < today)
            .ToListAsync();

        foreach (var sub in expired)
        {
            sub.IsActive = false;
            _logger.LogInformation("Deactivated expired subscription #{Id} (ended {End})", sub.Id, sub.EndDate);

            // If it was a private coach plan, mark trainee as Completed
            if (sub.SubscriptionPlan?.IncludesPrivateCoach == true && sub.Trainee != null)
            {
                sub.Trainee.TrainingStatus = TrainingStatus.Completed;
                _logger.LogInformation("Trainee #{TId} marked as Completed (private plan ended)", sub.Trainee.Id);
            }
        }

        // 2. Reset sessions for active subscriptions that entered a new month
        // We track this by checking if today is the monthly anniversary of the start date
        var active = await db.TraineeSubscriptions
            .Include(s => s.SubscriptionPlan)
            .Where(s => s.IsActive && s.EndDate.Date >= today)
            .ToListAsync();

        foreach (var sub in active)
        {
            // Check if today is the same day-of-month as start date (monthly anniversary)
            // e.g., started on the 5th → reset on the 5th of each month
            var startDay = sub.StartDate.Day;
            if (today.Day == startDay && today > sub.StartDate.Date)
            {
                sub.RemainingSessionsThisMonth = sub.SubscriptionPlan?.SessionsPerMonth ?? 0;
                _logger.LogInformation("Reset sessions for subscription #{Id} → {Sessions} sessions", sub.Id, sub.RemainingSessionsThisMonth);
            }
        }

        if (expired.Count > 0 || active.Any())
            await db.SaveChangesAsync();
    }
}
