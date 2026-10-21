using RabbitMQ.Client;

namespace AiService.Messaging;

public class RabbitMqConnection
{
    private readonly IConfiguration _configuration;

    public RabbitMqConnection(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task TestConnectionAsync()
    {
        var host = _configuration["RabbitMQ:Host"] ?? "localhost";
        var portValue = _configuration["RabbitMQ:Port"];

        var port = int.TryParse(portValue, out var parsedPort)
            ? parsedPort
            : 5672;

        var username = _configuration["RabbitMQ:Username"] ?? "guest";
        var password = _configuration["RabbitMQ:Password"] ?? "guest";

        var factory = new ConnectionFactory
        {
            HostName = host,
            Port = port,
            UserName = username,
            Password = password
        };

        await using var connection = await factory.CreateConnectionAsync();

        Console.WriteLine("RabbitMQ connection successful!");
    }
}
