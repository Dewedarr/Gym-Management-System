using System.Text;
using System.Text.Json;

namespace GymSystem.API.Services;

public class ChatBotService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public ChatBotService(IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _http = httpClientFactory.CreateClient();
        _apiKey = config["Groq:ApiKey"] ?? "";
    }

    public async Task<string> AskAsync(string userMessage, string? traineeContext = null)
    {
        if (string.IsNullOrEmpty(_apiKey))
            return "عذراً، المساعد الرياضي غير متاح حالياً. تأكد من إعداد API Key.";

        var systemPrompt = @"أنت مساعد متخصص في اللياقة البدنية والتغذية والتمارين الرياضية.
أنت تعمل في نظام إدارة جيم احترافي.

مهامك:
- الإجابة على أسئلة التمارين الرياضية والتقنيات الصحيحة
- تقديم نصائح التغذية والحميات الغذائية
- شرح فوائد التمارين المختلفة
- تقديم معلومات عن الوزن والطول وحساب BMI والدهون
- مساعدة المتدربين في أهدافهم الرياضية
- الإجابة عن المكملات الغذائية الآمنة

قواعد مهمة:
- أجب فقط في مجال اللياقة والتغذية والصحة الرياضية
- إذا سألك عن شيء خارج هذا المجال، قل: 'أنا متخصص فقط في اللياقة البدنية والتغذية'
- أجب بالعربية دائماً بشكل واضح ومفيد
- قدم معلومات علمية موثوقة
- كن إيجابياً ومحفزاً";

        if (!string.IsNullOrEmpty(traineeContext))
            systemPrompt += $"\n\nبيانات المتدرب الذي يكلمك الآن:\n{traineeContext}\n\nمهم جداً: استخدم هذه البيانات في إجابتك وخصّص النصيحة له بالاسم والأرقام الحقيقية. لا تعطِ إجابة عامة.";

        var body = JsonSerializer.Serialize(new
        {
            model = "llama-3.3-70b-versatile",
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            },
            max_tokens = 1024,
            temperature = 0.7
        });

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
        request.Headers.Add("Authorization", $"Bearer {_apiKey}");
        request.Content = new StringContent(body, Encoding.UTF8, "application/json");

        var response = await _http.SendAsync(request);
        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return "عذراً، المساعد الرياضي غير متاح حالياً.";

        using var doc = JsonDocument.Parse(json);
        var text = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        return text ?? "عذراً، حدث خطأ. حاول مرة أخرى.";
    }
}
