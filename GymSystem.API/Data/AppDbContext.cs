using GymSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GymSystem.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Coach> Coaches => Set<Coach>();
    public DbSet<Trainee> Trainees => Set<Trainee>();
    public DbSet<InBodyRecord> InBodyRecords => Set<InBodyRecord>();
    public DbSet<NutritionPlan> NutritionPlans => Set<NutritionPlan>();
    public DbSet<NutritionMeal> NutritionMeals => Set<NutritionMeal>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<TraineeExercise> TraineeExercises => Set<TraineeExercise>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<TraineeSubscription> TraineeSubscriptions => Set<TraineeSubscription>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<GymSettings> GymSettings => Set<GymSettings>();
    public DbSet<CoachingSession> CoachingSessions => Set<CoachingSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<Coach>()
            .HasOne(c => c.User)
            .WithOne(u => u.CoachProfile)
            .HasForeignKey<Coach>(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Trainee>()
            .HasOne(t => t.User)
            .WithOne(u => u.TraineeProfile)
            .HasForeignKey<Trainee>(t => t.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Trainee>()
            .HasOne(t => t.Coach)
            .WithMany(c => c.Trainees)
            .HasForeignKey(t => t.CoachId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<TraineeSubscription>()
            .HasOne(ts => ts.Trainee)
            .WithOne(t => t.ActiveSubscription)
            .HasForeignKey<TraineeSubscription>(ts => ts.TraineeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<NutritionPlan>()
            .HasOne(n => n.Trainee)
            .WithMany(t => t.NutritionPlans)
            .HasForeignKey(n => n.TraineeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InBodyRecord>()
            .HasOne(r => r.Trainee)
            .WithMany(t => t.InBodyRecords)
            .HasForeignKey(r => r.TraineeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TraineeExercise>()
            .HasOne(te => te.Trainee)
            .WithMany(t => t.TraineeExercises)
            .HasForeignKey(te => te.TraineeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ChatMessage>()
            .HasOne(m => m.Trainee)
            .WithMany(t => t.ChatMessages)
            .HasForeignKey(m => m.TraineeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CoachingSession>()
            .HasOne(s => s.Trainee).WithMany().HasForeignKey(s => s.TraineeId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<CoachingSession>()
            .HasOne(s => s.Coach).WithMany().HasForeignKey(s => s.CoachId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Coach>().Property(c => c.PrivateSessionPrice).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<SubscriptionPlan>().Property(p => p.Price).HasColumnType("decimal(18,2)");
        modelBuilder.Entity<TraineeSubscription>().Property(s => s.PaidAmount).HasColumnType("decimal(18,2)");

        modelBuilder.Entity<NutritionPlan>()
            .HasOne(n => n.Coach)
            .WithMany()
            .HasForeignKey(n => n.CoachId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<SubscriptionPlan>().HasData(
            new SubscriptionPlan
            {
                Id = 1, Name = "اشتراك عادي", Type = SubscriptionType.Regular,
                Price = 150, DurationMonths = 1, SessionsPerMonth = 12, InBodySessionsPerMonth = 1,
                IncludesNutritionPlan = false, IncludesPrivateCoach = false,
                Features = "دخول الجيم|12 سيشن في الشهر|InBody مرة واحدة"
            },
            new SubscriptionPlan
            {
                Id = 2, Name = "اشتراك بريميوم", Type = SubscriptionType.Premium,
                Price = 300, DurationMonths = 1, SessionsPerMonth = 26, InBodySessionsPerMonth = 2,
                IncludesNutritionPlan = true, IncludesPrivateCoach = false,
                Features = "دخول الجيم|26 سيشن في الشهر|InBody مرتين|خطة غذائية"
            },
            new SubscriptionPlan
            {
                Id = 3, Name = "تدريب برايفت", Type = SubscriptionType.PrivateCoaching,
                Price = 600, DurationMonths = 1, SessionsPerMonth = 12, InBodySessionsPerMonth = 2,
                IncludesNutritionPlan = true, IncludesPrivateCoach = true,
                Features = "دخول الجيم|12 سيشن مع كوتش|InBody مرتين|خطة غذائية|تمارين خاصة"
            }
        );

        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1, FullName = "Admin", Email = "admin@gym.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = UserRole.Admin, IsActive = true, CreatedAt = DateTime.UtcNow
            }
        );

        modelBuilder.Entity<GymSettings>().HasData(
            new GymSettings
            {
                Id = 1, GymName = "GymPro", Phone = "01000000000",
                WhatsApp = "201000000000", Address = "القاهرة، مصر",
                WorkingHours = "6 صباحاً - 12 منتصف الليل",
                InstaPay = "01000000000", VodafoneCash = "01000000000"
            }
        );
    }
}
