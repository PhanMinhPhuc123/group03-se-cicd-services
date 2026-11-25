
using AuthService.Data;
using AuthService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AuthService.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<AdminUser> _passwordHasher = new();

    public AuthController(
        AppDbContext context,
        IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                Message = "Vui lòng nhập username và mật khẩu."
            });
        }

        var username = request.Username.Trim().ToLowerInvariant();

        var admin = await _context.AdminUsers
            .FirstOrDefaultAsync(x =>
                x.Username.ToLower() == username);

        if (admin == null || !admin.IsActive)
        {
            return Unauthorized(new
            {
                Message = "Sai tên đăng nhập hoặc mật khẩu."
            });
        }

        var verification = _passwordHasher.VerifyHashedPassword(
            admin,
            admin.PasswordHash,
            request.Password);

        if (verification == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new
            {
                Message = "Sai tên đăng nhập hoặc mật khẩu."
            });
        }

        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
        {
            admin.PasswordHash = _passwordHasher.HashPassword(
                admin,
                request.Password);
        }

        admin.LastLoginAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(admin);

        return Ok(new
        {
            Message = "Đăng nhập thành công.",
            Token = token,
            Admin = new
            {
                admin.AdminId,
                admin.Username,
                admin.DisplayName
            }
        });
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentAdmin()
    {
        return Ok(new
        {
            AdminId = User.FindFirst("admin_id")?.Value,
            Username = User.FindFirst(ClaimTypes.Name)?.Value,
            DisplayName = User.FindFirst("display_name")?.Value,
            Role = User.FindFirst(ClaimTypes.Role)?.Value
        });
    }

    private string GenerateJwtToken(AdminUser admin)
    {
        var jwtKey = _configuration["Jwt:Key"];
        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];

        if (string.IsNullOrWhiteSpace(jwtKey) ||
            string.IsNullOrWhiteSpace(issuer) ||
            string.IsNullOrWhiteSpace(audience))
        {
            throw new InvalidOperationException(
                "Cấu hình JWT chưa đầy đủ.");
        }

        var claims = new[]
        {
            new Claim("admin_id", admin.AdminId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, admin.AdminId.ToString()),
            new Claim(ClaimTypes.Name, admin.Username),
            new Claim("display_name", admin.DisplayName),
            new Claim(ClaimTypes.Role, "Admin")
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey));

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}
