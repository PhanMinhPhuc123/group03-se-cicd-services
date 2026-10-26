using Minio;
using Minio.DataModel.Args;

namespace AiService.Services;

public class MinioService
{
    private readonly IMinioClient _minioClient;
    private readonly IConfiguration _configuration;

    public MinioService(IConfiguration configuration)
    {
        _configuration = configuration;

        var endpoint = configuration["MinIO:Endpoint"];
        var accessKey = configuration["MinIO:AccessKey"];
        var secretKey = configuration["MinIO:SecretKey"];
        var useSSL = bool.Parse(configuration["MinIO:UseSSL"] ?? "false");

        if (string.IsNullOrWhiteSpace(endpoint))
            throw new InvalidOperationException("Chưa cấu hình MinIO:Endpoint.");

        if (string.IsNullOrWhiteSpace(accessKey) ||
            string.IsNullOrWhiteSpace(secretKey))
            throw new InvalidOperationException("Chưa cấu hình thông tin đăng nhập MinIO.");

        _minioClient = new MinioClient()
            .WithEndpoint(endpoint)
            .WithCredentials(accessKey, secretKey)
            .WithSSL(useSSL)
            .Build();
    }

    // Lấy tên bucket lưu file âm thanh.
    private string GetAudioBucketName()
    {
        return _configuration["MinIO:BucketName"] ?? "narration-audio";
    }

    // Kiểm tra kết nối MinIO.
    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            await _minioClient.ListBucketsAsync();
            Console.WriteLine("MinIO connection successful!");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"MinIO connection failed: {ex.Message}");
            return false;
        }
    }

    // Tạo bucket âm thanh nếu bucket chưa tồn tại.
    private async Task EnsureAudioBucketExistsAsync(
        CancellationToken cancellationToken)
    {
        var bucketName = GetAudioBucketName();

        var exists = await _minioClient.BucketExistsAsync(
            new BucketExistsArgs().WithBucket(bucketName),
            cancellationToken);

        if (!exists)
        {
            await _minioClient.MakeBucketAsync(
                new MakeBucketArgs().WithBucket(bucketName),
                cancellationToken);
        }
    }

    // Tải nội dung MP3 lên MinIO.
    public async Task UploadAudioAsync(
        string objectName,
        byte[] audioBytes,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(objectName))
            throw new ArgumentException("Tên file không được để trống.", nameof(objectName));

        if (audioBytes == null || audioBytes.Length == 0)
            throw new ArgumentException("Dữ liệu âm thanh không được rỗng.", nameof(audioBytes));

        await EnsureAudioBucketExistsAsync(cancellationToken);

        using var stream = new MemoryStream(audioBytes);

        var args = new PutObjectArgs()
            .WithBucket(GetAudioBucketName())
            .WithObject(objectName)
            .WithStreamData(stream)
            .WithObjectSize(audioBytes.Length)
            .WithContentType("audio/mpeg");

        await _minioClient.PutObjectAsync(args, cancellationToken);
    }

    // Tải file MP3 từ MinIO về bộ nhớ để API trả về cho người dùng.
    public async Task<byte[]> DownloadAudioAsync(
        string objectName,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(objectName))
            throw new ArgumentException("Tên file không được để trống.", nameof(objectName));

        using var memoryStream = new MemoryStream();

        var args = new GetObjectArgs()
            .WithBucket(GetAudioBucketName())
            .WithObject(objectName)
            .WithCallbackStream(stream => stream.CopyTo(memoryStream));

        await _minioClient.GetObjectAsync(args, cancellationToken);

        return memoryStream.ToArray();
    }
}