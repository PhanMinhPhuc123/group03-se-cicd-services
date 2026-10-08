using Minio;
using Minio.DataModel.Args;

namespace AiService.Services;

public class MinioService
{
    private readonly IMinioClient _minioClient;

    public MinioService(IConfiguration configuration)
    {
        var endpoint = configuration["MinIO:Endpoint"];
        var accessKey = configuration["MinIO:AccessKey"];
        var secretKey = configuration["MinIO:SecretKey"];
        var useSSL = bool.Parse(configuration["MinIO:UseSSL"] ?? "false");

        _minioClient = new MinioClient()
            .WithEndpoint(endpoint)
            .WithCredentials(accessKey, secretKey)
            .WithSSL(useSSL)
            .Build();
    }

    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            var buckets = await _minioClient.ListBucketsAsync();

            Console.WriteLine("MinIO connection successful!");

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"MinIO connection failed: {ex.Message}");

            return false;
        }
    }
}