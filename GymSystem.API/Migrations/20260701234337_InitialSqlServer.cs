using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace GymSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialSqlServer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GymSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GymName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WhatsApp = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GoogleMapsUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WorkingHours = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InstaPay = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    VodafoneCash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LogoBase64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HeroImageBase64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HeroTitle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HeroSubtitle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GalleryImagesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BranchesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    YearsExperience = table.Column<int>(type: "int", nullable: false),
                    AboutText = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GymSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SubscriptionPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DurationMonths = table.Column<int>(type: "int", nullable: false),
                    SessionsPerMonth = table.Column<int>(type: "int", nullable: true),
                    InBodySessionsPerMonth = table.Column<int>(type: "int", nullable: true),
                    IncludesNutritionPlan = table.Column<bool>(type: "bit", nullable: false),
                    IncludesPrivateCoach = table.Column<bool>(type: "bit", nullable: false),
                    Features = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProfileImage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Bio = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Coaches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Specialization = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Bio = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaxPrivateTraineesPerMonth = table.Column<int>(type: "int", nullable: false),
                    PrivateSessionPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Coaches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Coaches_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Exercises",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CoachId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MuscleGroup = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MediaUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MediaType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Sets = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Reps = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Duration = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exercises", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Exercises_Coaches_CoachId",
                        column: x => x.CoachId,
                        principalTable: "Coaches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Trainees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CoachId = table.Column<int>(type: "int", nullable: true),
                    TrainingStartDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TrainingEndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TrainingDurationMonths = table.Column<int>(type: "int", nullable: true),
                    Height = table.Column<double>(type: "float", nullable: true),
                    Weight = table.Column<double>(type: "float", nullable: true),
                    Age = table.Column<int>(type: "int", nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FitnessGoal = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrialSessionsUsed = table.Column<int>(type: "int", nullable: false),
                    TrainingStatus = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trainees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Trainees_Coaches_CoachId",
                        column: x => x.CoachId,
                        principalTable: "Coaches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Trainees_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TraineeId = table.Column<int>(type: "int", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Response = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatMessages_Trainees_TraineeId",
                        column: x => x.TraineeId,
                        principalTable: "Trainees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CoachingSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TraineeId = table.Column<int>(type: "int", nullable: false),
                    CoachId = table.Column<int>(type: "int", nullable: false),
                    SessionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    MarkedByCoach = table.Column<bool>(type: "bit", nullable: false),
                    MarkedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ConfirmedByAdminId = table.Column<int>(type: "int", nullable: true),
                    ConfirmedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoachingSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CoachingSessions_Coaches_CoachId",
                        column: x => x.CoachId,
                        principalTable: "Coaches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CoachingSessions_Trainees_TraineeId",
                        column: x => x.TraineeId,
                        principalTable: "Trainees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InBodyRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TraineeId = table.Column<int>(type: "int", nullable: false),
                    RecordDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Weight = table.Column<double>(type: "float", nullable: false),
                    Height = table.Column<double>(type: "float", nullable: false),
                    BodyFatPercentage = table.Column<double>(type: "float", nullable: true),
                    MuscleMass = table.Column<double>(type: "float", nullable: true),
                    BMI = table.Column<double>(type: "float", nullable: true),
                    VisceralFat = table.Column<double>(type: "float", nullable: true),
                    WaterPercentage = table.Column<double>(type: "float", nullable: true),
                    BoneMass = table.Column<double>(type: "float", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AttachmentBase64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AttachmentType = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InBodyRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InBodyRecords_Trainees_TraineeId",
                        column: x => x.TraineeId,
                        principalTable: "Trainees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NutritionPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TraineeId = table.Column<int>(type: "int", nullable: false),
                    CoachId = table.Column<int>(type: "int", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsAutoGenerated = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AttachmentBase64 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AttachmentType = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NutritionPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NutritionPlans_Coaches_CoachId",
                        column: x => x.CoachId,
                        principalTable: "Coaches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NutritionPlans_Trainees_TraineeId",
                        column: x => x.TraineeId,
                        principalTable: "Trainees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TraineeExercises",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TraineeId = table.Column<int>(type: "int", nullable: false),
                    ExerciseId = table.Column<int>(type: "int", nullable: false),
                    Day = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TraineeExercises", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TraineeExercises_Exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "Exercises",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TraineeExercises_Trainees_TraineeId",
                        column: x => x.TraineeId,
                        principalTable: "Trainees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TraineeSubscriptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TraineeId = table.Column<int>(type: "int", nullable: false),
                    SubscriptionPlanId = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RemainingSessionsThisMonth = table.Column<int>(type: "int", nullable: false),
                    RemainingInBodySessions = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    PaidAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaymentStatus = table.Column<int>(type: "int", nullable: false),
                    PaymentMethod = table.Column<int>(type: "int", nullable: true),
                    PaymentReference = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PaymentConfirmedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ConfirmedByAdminId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TraineeSubscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TraineeSubscriptions_SubscriptionPlans_SubscriptionPlanId",
                        column: x => x.SubscriptionPlanId,
                        principalTable: "SubscriptionPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TraineeSubscriptions_Trainees_TraineeId",
                        column: x => x.TraineeId,
                        principalTable: "Trainees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "NutritionMeals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NutritionPlanId = table.Column<int>(type: "int", nullable: false),
                    MealName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Time = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Foods = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Calories = table.Column<int>(type: "int", nullable: true),
                    Protein = table.Column<double>(type: "float", nullable: true),
                    Carbs = table.Column<double>(type: "float", nullable: true),
                    Fats = table.Column<double>(type: "float", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NutritionMeals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NutritionMeals_NutritionPlans_NutritionPlanId",
                        column: x => x.NutritionPlanId,
                        principalTable: "NutritionPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "GymSettings",
                columns: new[] { "Id", "AboutText", "Address", "BranchesJson", "Email", "GalleryImagesJson", "GoogleMapsUrl", "GymName", "HeroImageBase64", "HeroSubtitle", "HeroTitle", "InstaPay", "LogoBase64", "Phone", "VodafoneCash", "WhatsApp", "WorkingHours", "YearsExperience" },
                values: new object[] { 1, null, "القاهرة، مصر", null, "", null, "", "GymPro", null, "كل يوم خطوة نحو الأفضل", "مرحباً بك في جيمنا! 💪", "01000000000", null, "01000000000", "01000000000", "201000000000", "6 صباحاً - 12 منتصف الليل", 0 });

            migrationBuilder.InsertData(
                table: "SubscriptionPlans",
                columns: new[] { "Id", "DurationMonths", "Features", "InBodySessionsPerMonth", "IncludesNutritionPlan", "IncludesPrivateCoach", "IsActive", "Name", "Price", "SessionsPerMonth", "Type" },
                values: new object[,]
                {
                    { 1, 1, "دخول الجيم|12 سيشن في الشهر|InBody مرة واحدة", 1, false, false, true, "اشتراك عادي", 150m, 12, 0 },
                    { 2, 1, "دخول الجيم|26 سيشن في الشهر|InBody مرتين|خطة غذائية", 2, true, false, true, "اشتراك بريميوم", 300m, 26, 1 },
                    { 3, 1, "دخول الجيم|12 سيشن مع كوتش|InBody مرتين|خطة غذائية|تمارين خاصة", 2, true, true, true, "تدريب برايفت", 600m, 12, 2 }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Address", "Bio", "CreatedAt", "Email", "FullName", "IsActive", "PasswordHash", "Phone", "ProfileImage", "Role" },
                values: new object[] { 1, null, null, new DateTime(2026, 7, 1, 23, 43, 36, 988, DateTimeKind.Utc).AddTicks(9617), "admin@gym.com", "Admin", true, "$2a$11$6Uw7AQBs4mmYMAqOr7.8NuKwg/fJqtw939CRvQ64KgzjuB2fWS1ZW", null, null, 0 });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_TraineeId",
                table: "ChatMessages",
                column: "TraineeId");

            migrationBuilder.CreateIndex(
                name: "IX_Coaches_UserId",
                table: "Coaches",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CoachingSessions_CoachId",
                table: "CoachingSessions",
                column: "CoachId");

            migrationBuilder.CreateIndex(
                name: "IX_CoachingSessions_TraineeId",
                table: "CoachingSessions",
                column: "TraineeId");

            migrationBuilder.CreateIndex(
                name: "IX_Exercises_CoachId",
                table: "Exercises",
                column: "CoachId");

            migrationBuilder.CreateIndex(
                name: "IX_InBodyRecords_TraineeId",
                table: "InBodyRecords",
                column: "TraineeId");

            migrationBuilder.CreateIndex(
                name: "IX_NutritionMeals_NutritionPlanId",
                table: "NutritionMeals",
                column: "NutritionPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_NutritionPlans_CoachId",
                table: "NutritionPlans",
                column: "CoachId");

            migrationBuilder.CreateIndex(
                name: "IX_NutritionPlans_TraineeId",
                table: "NutritionPlans",
                column: "TraineeId");

            migrationBuilder.CreateIndex(
                name: "IX_TraineeExercises_ExerciseId",
                table: "TraineeExercises",
                column: "ExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_TraineeExercises_TraineeId",
                table: "TraineeExercises",
                column: "TraineeId");

            migrationBuilder.CreateIndex(
                name: "IX_Trainees_CoachId",
                table: "Trainees",
                column: "CoachId");

            migrationBuilder.CreateIndex(
                name: "IX_Trainees_UserId",
                table: "Trainees",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TraineeSubscriptions_SubscriptionPlanId",
                table: "TraineeSubscriptions",
                column: "SubscriptionPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_TraineeSubscriptions_TraineeId",
                table: "TraineeSubscriptions",
                column: "TraineeId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatMessages");

            migrationBuilder.DropTable(
                name: "CoachingSessions");

            migrationBuilder.DropTable(
                name: "GymSettings");

            migrationBuilder.DropTable(
                name: "InBodyRecords");

            migrationBuilder.DropTable(
                name: "NutritionMeals");

            migrationBuilder.DropTable(
                name: "TraineeExercises");

            migrationBuilder.DropTable(
                name: "TraineeSubscriptions");

            migrationBuilder.DropTable(
                name: "NutritionPlans");

            migrationBuilder.DropTable(
                name: "Exercises");

            migrationBuilder.DropTable(
                name: "SubscriptionPlans");

            migrationBuilder.DropTable(
                name: "Trainees");

            migrationBuilder.DropTable(
                name: "Coaches");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
