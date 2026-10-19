
using AuthService.Data;
using AuthService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AuthService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly PasswordHasher<User> _passwordHasher;

        public AuthController(
            AppDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
            _passwordHasher = new PasswordHasher<User>();
        }

        // Đăng ký tài khoản
        [HttpPost("register")]
        public async Task<IActionResult> Register(
            [FromBody] RegisterRequest request)
        {
            // Kiểm tra dữ liệu đầu vào
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    Message = "Vui lòng nhập đầy đủ username, email và mật khẩu."
                });
            }

            // Kiểm tra username đã tồn tại
            if (await _context.Users.AnyAsync(
                u => u.Username == request.Username))
            {
                return BadRequest(new
                {
                    Message = "Username đã tồn tại!"
                });
            }

            // Kiểm tra email đã tồn tại
            if (await _context.Users.AnyAsync(
                u => u.Email == request.Email))
            {
                return BadRequest(new
                {
                    Message = "Email đã tồn tại!"
                });
            }

            // Lấy role mặc định
            var defaultRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == "User");

            if (defaultRole == null)
            {
                return StatusCode(500, new
                {
                    Message = "Role mặc định chưa được thiết lập."
                });
            }

            // Tạo người dùng mới
            var newUser = new User
            {
                Username = request.Username.Trim(),
                Email = request.Email.Trim(),
                RoleId = defaultRole.Id,
                CreatedAt = DateTime.UtcNow
            };

            // Băm mật khẩu trước khi lưu
            newUser.PasswordHash = _passwordHasher.HashPassword(
                newUser,
                request.Password);

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Đăng ký tài khoản thành công!"
            });
        }

        // Đăng nhập
        [HttpPost("login")]
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

            // Lấy người dùng cùng Role
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(
                    u => u.Username == request.Username);

            if (user == null)
            {
                return Unauthorized(new
                {
                    Message = "Sai tên đăng nhập hoặc mật khẩu!"
                });
            }
// Kiểm tra tài khoản có đang hoạt động không
if (!user.IsActive)
{
    return Unauthorized(new
    {
        Message = "Tài khoản đã bị vô hiệu hóa!"
    });
}

            // Kiểm tra mật khẩu
            var verifyResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.Password);

            if (verifyResult == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    Message = "Sai tên đăng nhập hoặc mật khẩu!"
                });
            }

            // Kiểm tra Role
            if (user.Role == null)
            {
                return StatusCode(500, new
                {
                    Message = "Tài khoản chưa được gán vai trò hợp lệ."
                });
            }

            // Tạo JWT
            var token = GenerateJwtToken(user);

            return Ok(new
            {
                Message = "Đăng nhập thành công!",
                Token = token
            });
        }

        // Kiểm tra token đăng nhập
        [HttpGet("me")]
        [Authorize]
        public IActionResult GetCurrentUser()
        {
            var userId = User.FindFirst(
                ClaimTypes.NameIdentifier)?.Value;

            var username = User.FindFirst(
                ClaimTypes.Name)?.Value;

            var role = User.FindFirst(
                ClaimTypes.Role)?.Value;

            return Ok(new
            {
                Message = "Xác thực token thành công!",
                UserId = userId,
                Username = username,
                Role = role
            });
        }

        // Tạo JWT
        private string GenerateJwtToken(User user)
        {
            var jwtKey = _configuration["Jwt:Key"];
            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];

            // Kiểm tra cấu hình JWT
            if (string.IsNullOrWhiteSpace(jwtKey) ||
                string.IsNullOrWhiteSpace(issuer) ||
                string.IsNullOrWhiteSpace(audience))
            {
                throw new InvalidOperationException(
                    "Cấu hình JWT chưa đầy đủ.");
            }

            // Kiểm tra Role trước khi tạo token
            if (user.Role == null)
            {
                throw new InvalidOperationException(
                    "Không tìm thấy Role của người dùng.");
            }

            var securityKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey));

            var credentials = new SigningCredentials(
                securityKey,
                SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(
                    ClaimTypes.NameIdentifier,
                    user.Id.ToString()),

                new Claim(
                    ClaimTypes.Name,
                    user.Username),

                new Claim(
                    ClaimTypes.Email,
                    user.Email),

                new Claim(
                    ClaimTypes.Role,
                    user.Role.Name)
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }
    }

    // Dữ liệu yêu cầu đăng ký
    public class RegisterRequest
    {
        public string Username { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
    }

    // Dữ liệu yêu cầu đăng nhập
    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
    }
}
