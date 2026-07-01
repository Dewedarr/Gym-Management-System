namespace GymSystem.API.Models;

public class GymSettings
{
    public int Id { get; set; } = 1;
    public string GymName { get; set; } = "GymPro";
    public string Phone { get; set; } = "";
    public string WhatsApp { get; set; } = "";
    public string Address { get; set; } = "";
    public string GoogleMapsUrl { get; set; } = "";
    public string WorkingHours { get; set; } = "6 صباحاً - 12 منتصف الليل";
    public string Email { get; set; } = "";
    public string InstaPay { get; set; } = "";
    public string VodafoneCash { get; set; } = "";
    public string? LogoBase64 { get; set; }

    // Dashboard visuals (admin controlled)
    public string? HeroImageBase64 { get; set; }
    public string? HeroTitle { get; set; } = "مرحباً بك في جيمنا! 💪";
    public string? HeroSubtitle { get; set; } = "كل يوم خطوة نحو الأفضل";
    public string? GalleryImagesJson { get; set; } // JSON: [{url, caption}]
    public string? BranchesJson { get; set; }       // JSON: [{name, address, mapsUrl}]
    public int YearsExperience { get; set; } = 0;
    public string? AboutText { get; set; }
}
