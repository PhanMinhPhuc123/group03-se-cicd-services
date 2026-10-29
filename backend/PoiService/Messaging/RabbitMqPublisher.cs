using System.Text;
using System.Text.Json;
using RabbitMQ.Client;

namespace PoiService.Messaging;

public class RabbitMqPublisher
{
    private readonly IConfiguration _configuration;

    public RabbitMqPublisher(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task PublishAsync(string eventName, object data)
    {
        var hostName = _configuration["RabbitMQ:Host"]
            ?? "localhost";

        var port = int.TryParse(
            _configuration["RabbitMQ:Port"],
            out var configuredPort)
            ? configuredPort
            : 5672;

        var userName = _configuration["RabbitMQ:Username"]
            ?? "guest";

        var password = _configuration["RabbitMQ:Password"]
            ?? "guest";

        var factory = new ConnectionFactory
        {
            HostName = hostName,
            Port = port,
            UserName = userName,
            Password = password
        };

        await using var connection =
            await factory.CreateConnectionAsync();

        // Bat publisher confirms va theo doi ket qua xac nhan.
        var channelOptions = new CreateChannelOptions(
            publisherConfirmationsEnabled: true,
            publisherConfirmationTrackingEnabled: true);

        await using var channel =
            await connection.CreateChannelAsync(channelOptions);

        await channel.ExchangeDeclareAsync(
            exchange: "poi.events",
            type: ExchangeType.Fanout,
            durable: true,
            autoDelete: false);

        var message = new
        {
            eventName,
            occurredAt = DateTime.UtcNow,
            data
        };

        var body = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(message));

        var properties = new BasicProperties
        {
            ContentType = "application/json",
            MessageId = Guid.NewGuid().ToString("N"),
            Persistent = true
        };

        // Cho phep RabbitMQ bao loi neu message khong duoc route.
        // Khi publisher confirms duoc bat, await se doi ket qua
        // xac nhan va co the nem exception neu publish that bai.
        await channel.BasicPublishAsync(
            exchange: "poi.events",
            routingKey: string.Empty,
            mandatory: true,
            basicProperties: properties,
            body: body);
    }
}