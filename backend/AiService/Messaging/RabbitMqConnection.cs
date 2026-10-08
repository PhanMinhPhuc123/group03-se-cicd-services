using RabbitMQ.Client;

namespace AiService.Messaging
{
    public class RabbitMqConnection
    {
        private readonly IConfiguration _configuration;

        public RabbitMqConnection(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task TestConnectionAsync()
        {
            var host = _configuration["RabbitMQ:Host"];
            var port = int.Parse(_configuration["RabbitMQ:Port"]!);
            var username = _configuration["RabbitMQ:Username"];
            var password = _configuration["RabbitMQ:Password"];

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
}