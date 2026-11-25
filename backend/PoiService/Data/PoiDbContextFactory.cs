
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using PoiService.Data;

namespace PoiService.Data;

public class PoiDbContextFactory : IDesignTimeDbContextFactory<PoiDbContext>
{
    public PoiDbContext CreateDbContext(string[] args)
    {
        var projectDirectory = FindProjectDirectory();

        var envPath = Path.Combine(projectDirectory, "..", ".env");
        var env = LoadEnvFile(envPath);

        var connectionString =
            Environment.GetEnvironmentVariable(
                "ConnectionStrings__DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            connectionString =
                $"Host=localhost;Port=5433;" +
                $"Database={GetRequired(env, "POI_DB")};" +
                $"Username={GetRequired(env, "POSTGRES_USER")};" +
                $"Password={GetRequired(env, "POSTGRES_PASSWORD")}";
        }
        else
        {
            var builder =
                new Npgsql.NpgsqlConnectionStringBuilder(connectionString)
                {
                    Host = "localhost",
                    Port = 5433
                };

            connectionString = builder.ConnectionString;
        }

        var options = new DbContextOptionsBuilder<PoiDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new PoiDbContext(options);
    }

    private static string FindProjectDirectory()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory != null)
        {
            if (File.Exists(
                Path.Combine(directory.FullName, "PoiService.csproj")))
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        throw new DirectoryNotFoundException(
            "Không tìm thấy thư mục chứa PoiService.csproj.");
    }

    private static Dictionary<string, string> LoadEnvFile(string path)
    {
        if (!File.Exists(path))
        {
            throw new FileNotFoundException(
                "Không tìm thấy file backend/.env.", path);
        }

        return File.ReadAllLines(path)
            .Where(line =>
                !string.IsNullOrWhiteSpace(line) &&
                !line.TrimStart().StartsWith("#") &&
                line.Contains('='))
            .Select(line => line.Split('=', 2))
            .ToDictionary(
                parts => parts[0].Trim(),
                parts => parts[1].Trim().Trim('"', '\''),
                StringComparer.OrdinalIgnoreCase);
    }

    private static string GetRequired(
        Dictionary<string, string> env, string key)
    {
        if (!env.TryGetValue(key, out var value) ||
            string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException(
                $"Thiếu biến môi trường {key} trong backend/.env.");
        }

        return value;
    }
}
