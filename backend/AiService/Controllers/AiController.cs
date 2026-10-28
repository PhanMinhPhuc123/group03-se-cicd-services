
using Microsoft.AspNetCore.Mvc;

namespace AiService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        [HttpGet("health")]
        public IActionResult Health()
        {
            return Ok(new
            {
                service = "AiService",
                status = "Running",
                message = "AiService is working correctly."
            });
        }
    }
}
