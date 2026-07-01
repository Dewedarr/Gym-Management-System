using GymSystem.API.Data;
using GymSystem.API.DTOs;
using GymSystem.API.Helpers;
using GymSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GymSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtHelper _jwt;

    public AuthController(AppDbContext db, JwtHelper jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email && u.IsActive);
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "بيانات الدخول غير صحيحة" });

        var token = _jwt.GenerateToken(user);
        return Ok(new AuthResponse(user.Id, user.FullName, user.Email, user.Role.ToString(), token, user.ProfileImage));
    }

    // Public: Register as Trainee only
    [HttpPost("register-trainee")]
    public async Task<IActionResult> RegisterTrainee([FromBody] RegisterTraineeRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FullName) || req.FullName.Trim().Length < 2)
            return BadRequest(new { message = "الاسم يجب أن يكون حرفين على الأقل" });

        if (string.IsNullOrWhiteSpace(req.Email) || !req.Email.Contains('@'))
            return BadRequest(new { message = "البريد الإلكتروني غير صحيح" });

        if (req.Password.Length < 8)
            return BadRequest(new { message = "كلمة المرور 8 أحرف على الأقل" });

        if (!string.IsNullOrEmpty(req.Phone) && !System.Text.RegularExpressions.Regex.IsMatch(req.Phone, @"^01[0125][0-9]{8}$"))
            return BadRequest(new { message = "رقم الهاتف غير صحيح" });

        if (await _db.Users.AnyAsync(u => u.Email == req.Email.ToLower().Trim()))
            return BadRequest(new { message = "البريد الإلكتروني مسجل بالفعل" });

        if (!string.IsNullOrEmpty(req.Phone) && await _db.Users.AnyAsync(u => u.Phone == req.Phone))
            return BadRequest(new { message = "رقم الهاتف مسجل بالفعل" });

        var user = new User
        {
            FullName = req.FullName.Trim(),
            Email = req.Email.ToLower().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = UserRole.Trainee,
            Phone = string.IsNullOrEmpty(req.Phone) ? null : req.Phone
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        _db.Trainees.Add(new Trainee { UserId = user.Id });
        await _db.SaveChangesAsync();

        return Ok(new { message = "تم إنشاء الحساب بنجاح" });
    }

    // Admin: Register Coach or Admin — returns plain password to share
    [HttpPost("register")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FullName) || req.FullName.Trim().Length < 2)
            return BadRequest(new { message = "الاسم يجب أن يكون حرفين على الأقل" });

        if (string.IsNullOrWhiteSpace(req.Email) || !req.Email.Contains('@'))
            return BadRequest(new { message = "البريد الإلكتروني غير صحيح" });

        if (!string.IsNullOrEmpty(req.Phone) && !System.Text.RegularExpressions.Regex.IsMatch(req.Phone, @"^01[0125][0-9]{8}$"))
            return BadRequest(new { message = "رقم الهاتف غير صحيح" });

        if (await _db.Users.AnyAsync(u => u.Email == req.Email.ToLower().Trim()))
            return BadRequest(new { message = "البريد الإلكتروني مسجل بالفعل" });

        if (!string.IsNullOrEmpty(req.Phone) && await _db.Users.AnyAsync(u => u.Phone == req.Phone))
            return BadRequest(new { message = "رقم الهاتف مسجل بالفعل" });

        if (!Enum.TryParse<UserRole>(req.Role, true, out var role))
            return BadRequest(new { message = "الدور غير صحيح" });

        if (role == UserRole.Trainee)
            return BadRequest(new { message = "المتدربون يسجلون بأنفسهم من صفحة التسجيل" });

        var user = new User
        {
            FullName = req.FullName.Trim(),
            Email = req.Email.ToLower().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = role,
            Phone = string.IsNullOrEmpty(req.Phone) ? null : req.Phone
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        if (role == UserRole.Coach)
            _db.Coaches.Add(new Coach { UserId = user.Id });

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "تم إنشاء الحساب بنجاح",
            userId = user.Id,
            fullName = user.FullName,
            email = user.Email,
            password = req.Password,   // plain — admin shares this once
            role = user.Role.ToString()
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        var token = _jwt.GenerateToken(user);
        return Ok(new AuthResponse(user.Id, user.FullName, user.Email, user.Role.ToString(), token, user.ProfileImage));
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "كلمة المرور الحالية غير صحيحة" });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await _db.SaveChangesAsync();

        return Ok(new { message = "تم تغيير كلمة المرور بنجاح" });
    }
}
