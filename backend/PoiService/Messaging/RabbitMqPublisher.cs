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
        var hostName = _configuration["RabbitMQ:Host"] ?? "localhost";
        var port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672");
        var userName = _configuration["RabbitMQ:Username"] ?? "guest";
        var password = _configuration["RabbitMQ:Password"] ?? "guest";

        var factory = new ConnectionFactory
        {
            HostName = hostName,
            Port = port,
            UserName = userName,
            Password = password
        };

        await using var connection = await factory.CreateConnectionAsync();
        await using var channel = await connection.CreateChannelAsync();

        await channel.ExchangeDeclareAsync(
            exchange: "poi.events",
            type: ExchangeType.Fanout,
            durable: true,
            autoDelete: false);

        var message = new
        {
            eventName = eventName,
            occurredAt = DateTime.UtcNow,
            data = data
        };

        var json = JsonSerializer.Serialize(message);
        var body = Encoding.UTF8.GetBytes(json);

        await channel.BasicPublishAsync(
            exchange: "poi.events",
            routingKey: string.Empty,
            body: body);
    }
}