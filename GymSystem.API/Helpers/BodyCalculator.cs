namespace GymSystem.API.Helpers;

public static class BodyCalculator
{
    public static double CalcBMI(double weightKg, double heightCm)
    {
        double heightM = heightCm / 100.0;
        return Math.Round(weightKg / (heightM * heightM), 1);
    }

    public static string BMICategory(double bmi) => bmi switch
    {
        < 18.5 => "نقص في الوزن",
        < 25 => "وزن طبيعي",
        < 30 => "زيادة في الوزن",
        _ => "سمنة"
    };

    public static double EstimateBodyFat(double bmi, int age, string gender)
    {
        double fat = gender.ToLower() == "female"
            ? (1.20 * bmi) + (0.23 * age) - 5.4
            : (1.20 * bmi) + (0.23 * age) - 16.2;
        return Math.Round(fat, 1);
    }

    public static string BodyFatCategory(double fat, string gender)
    {
        if (gender.ToLower() == "female")
            return fat < 21 ? "منخفضة" : fat < 33 ? "طبيعية" : "مرتفعة";
        return fat < 8 ? "منخفضة" : fat < 20 ? "طبيعية" : "مرتفعة";
    }

    public static double IdealWeight(double heightCm, string gender)
    {
        double h = heightCm - 100;
        return gender.ToLower() == "female" ? h - (h * 0.10) : h - (h * 0.05);
    }

    public static int DailyCalories(double weightKg, double heightCm, int age, string gender, string goal)
    {
        double bmr = gender.ToLower() == "female"
            ? 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age)
            : 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age);

        double tdee = bmr * 1.55;

        return goal?.ToLower() switch
        {
            "lose weight" or "خسارة وزن" => (int)(tdee - 500),
            "gain muscle" or "بناء عضلات" => (int)(tdee + 300),
            _ => (int)tdee
        };
    }

    public static (int protein, int carbs, int fats) MacroSplit(int calories, string goal)
    {
        return goal?.ToLower() switch
        {
            "gain muscle" or "بناء عضلات" => (
                (int)(calories * 0.30 / 4),
                (int)(calories * 0.50 / 4),
                (int)(calories * 0.20 / 9)
            ),
            "lose weight" or "خسارة وزن" => (
                (int)(calories * 0.40 / 4),
                (int)(calories * 0.35 / 4),
                (int)(calories * 0.25 / 9)
            ),
            _ => (
                (int)(calories * 0.30 / 4),
                (int)(calories * 0.45 / 4),
                (int)(calories * 0.25 / 9)
            )
        };
    }
}
