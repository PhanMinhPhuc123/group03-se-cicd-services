using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PoiService.Data;
using PoiService.Models;

namespace PoiService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccessCodesController : ControllerBase
{
    private readonly PoiDbContext _context;

    public AccessCodesController(PoiDbContext context)
    {
        _context = context;
    }

    // GET: api/AccessCodes
    // Lấy danh sách tất cả mã truy cập
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AccessCode>>> GetAccessCodes()
    {
        return await _context.AccessCodes
         .ToListAsync();
    }


    // POST: api/AccessCodes/validate
    // Kiểm tra mã truy cập và trạng thái Tour trước khi tải nội dung hướng dẫn
    [HttpPost("validate")]
    public async Task<IActionResult> ValidateAccessCode([FromBody] string code)
    {
        // 1. Kiểm tra mã truy cập có tồn tại không
        var accessCode = await _context.AccessCodes
            .Include(a => a.Tour)
            .FirstOrDefaultAsync(a => a.Code == code);

        if (accessCode == null)
        {
            return NotFound("Access Code không tồn tại.");
        }

        // 2. Kiểm tra trạng thái mã truy cập
        if (!accessCode.IsActive)
        {
            return BadRequest("Access Code đã bị vô hiệu hóa.");
        }

        // 3. Kiểm tra thời hạn của mã
        if (accessCode.ExpiredAt <= DateTime.UtcNow)
        {
            return BadRequest("Access Code đã hết hạn.");
        }

        // 4. Kiểm tra Tour liên kết có tồn tại không
        if (accessCode.Tour == null)
        {
            return NotFound("Tour liên kết với Access Code không tồn tại.");
        }

        // 5. Tour phải đang hoạt động mới được tải nội dung hướng dẫn
        if (!accessCode.Tour.IsActive)
        {
            return BadRequest("Tour hiện không hoạt động.");
        }

        // 6. Mã và Tour đều hợp lệ
        return Ok(new
        {
            message = "Access Code hợp lệ.",
            tourId = accessCode.TourId,
            tourName = accessCode.Tour.Name,
            tourDescription = accessCode.Tour.Description,
            isActive = accessCode.Tour.IsActive
        });
    }

    // GET: api/AccessCodes/5
    // Lấy thông tin một mã truy cập theo ID
    [HttpGet("{id}")]
    public async Task<ActionResult<AccessCode>> GetAccessCode(int id)
    {
        var accessCode = await _context.AccessCodes
            
            .FirstOrDefaultAsync(a => a.Id == id);

        if (accessCode == null)
        {
            return NotFound();
        }

        return accessCode;
    }

    // POST: api/AccessCodes
    // Thêm một mã truy cập mới
    [HttpPost]
    public async Task<ActionResult<AccessCode>> CreateAccessCode(AccessCode accessCode)
    {
        _context.AccessCodes.Add(accessCode);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetAccessCode),
            new { id = accessCode.Id },
            accessCode);
    }

    // PUT: api/AccessCodes/5
    // Cập nhật thông tin mã truy cập
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAccessCode(
        int id,
        AccessCode accessCode)
    {
        if (id != accessCode.Id)
        {
            return BadRequest();
        }

        _context.Entry(accessCode).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!AccessCodeExists(id))
            {
                return NotFound();
            }

            throw;
        }

        return NoContent();
    }

    // DELETE: api/AccessCodes/5
    // Xóa mã truy cập
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAccessCode(int id)
    {
        var accessCode = await _context.AccessCodes.FindAsync(id);

        if (accessCode == null)
        {
            return NotFound();
        }

        _context.AccessCodes.Remove(accessCode);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool AccessCodeExists(int id)
    {
        return _context.AccessCodes.Any(e => e.Id == id);
    }
}