# 🏋️ GymPro - نظام إدارة الجيم

## المتطلبات
- .NET 8 SDK
- SQL Server (LocalDB أو Express)
- Node.js 18+
- Anthropic API Key (للـ FitBot)

## خطوات التشغيل

### 1. إعداد API Key للـ ChatBot
افتح `GymSystem.API/appsettings.json` وضع API Key الخاص بيك:
```json
"Anthropic": {
  "ApiKey": "sk-ant-..."
}
```

### 2. تشغيل Backend
```
انقر دبل كليك على: تشغيل_Backend.bat
```
أو:
```bash
cd GymSystem.API
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run --urls "http://localhost:5000"
```

### 3. تشغيل Frontend
```
انقر دبل كليك على: تشغيل_Frontend.bat
```
أو:
```bash
cd gym-frontend
npm install
npm run dev
```

## بيانات الدخول الافتراضية
- **الأدمن**: admin@gym.com / Admin@123

## الصلاحيات

### Admin 👑
- إدارة كل المستخدمين (إضافة/تعطيل/حذف)
- إدارة الكوتشز
- إدارة الباقات والاشتراكات
- رؤية كل الإحصائيات

### Coach 🎯
- رؤية متدربيه فقط (مش بيشوف غيرهم)
- إضافة تمارين (فيديو/صور)
- تعيين تمارين لكل متدرب
- إنشاء خطط تغذية
- تحديد الحد الأقصى من المتدربين البرايفت

### Trainee 🏃
- اختيار الكوتش ومدة التدريب
- تسجيل InBody والمقاسات
- عرض التمارين وتأشير المكتملة
- عرض خطط التغذية
- إحصائيات الجسم (BMI، دهون، سعرات...)
- الاشتراك في الباقات
- FitBot للأسئلة الرياضية

## الباقات
| الباقة | السعر | السيشنز | InBody | كوتش |
|--------|-------|---------|--------|------|
| عادي | 150 ج | 12 | 1 | ❌ |
| بريميوم | 300 ج | 26 | 2 | ❌ |
| برايفت | 600 ج | 12 | 2 | ✅ |
