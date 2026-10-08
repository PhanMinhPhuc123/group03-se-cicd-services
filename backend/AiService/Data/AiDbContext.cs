using Microsoft.EntityFrameworkCore;

namespace AiService.Data
{
    public class AiDbContext : DbContext
    {
        public AiDbContext(DbContextOptions<AiDbContext> options)
            : base(options)
        {
        }
    }
}