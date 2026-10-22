
using System.Text;
using System.Text.Json;
using AiService.Data;
using AiService.Models;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace AiService.Messaging;

public sealed class PoiEventConsumerService : BackgroundService
{
    private const string ExchangeName = "poi.events";
    private const string QueueName = "ai.poi.events";

    private const string RetryExchange = "ai.poi.events.retry.exchange";
    private const string RetryQueue = "ai.poi.events.retry";

    private const string DeadLetterExchange = "ai.poi.events.dlx";
    private const string DeadLetterQueue = "ai.poi.events.dlq";
    private const string DeadLetterRoutingKey = "ai.poi.events.dead";

    private const int MaxRetries = 3;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PoiEventConsumerService> _logger;

    public PoiEventConsumerService(
        IConfiguration configuration,
        IServiceScopeFactory scopeFactory,
        ILogger<PoiEventConsumerService> logger)
    {
        _configuration = configuration;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = _configuration["RabbitMQ:Host"] ?? "localhost",
                    Port = int.TryParse(_configuration["RabbitMQ:Port"], out var port)
                        ? port
                        : 5672,
                    UserName = _configuration["RabbitMQ:Username"] ?? "guest",
                    Password = _configuration["RabbitMQ:Password"] ?? "guest"
                };

                await using var connection =
                    await factory.CreateConnectionAsync(stoppingToken);

                await using var channel =
                    await connection.CreateChannelAsync(
                        cancellationToken: stoppingToken);

                await DeclareTopologyAsync(channel, stoppingToken);

                await channel.BasicQosAsync(
                    prefetchSize: 0,
                    prefetchCount: 1,
                    global: false,
                    cancellationToken: stoppingToken);

                var shutdownSignal = new TaskCompletionSource<bool>(
                    TaskCreationOptions.RunContinuationsAsynchronously);

                connection.ConnectionShutdownAsync += (_, _) =>
                {
                    shutdownSignal.TrySetResult(true);
                    return Task.CompletedTask;
                };

                var consumer = new AsyncEventingBasicConsumer(channel);

                consumer.ReceivedAsync += async (_, eventArgs) =>
                {
                    await HandleMessageAsync(channel, eventArgs, stoppingToken);
                };

                await channel.BasicConsumeAsync(
                    queue: QueueName,
                    autoAck: false,
                    consumer: consumer,
                    cancellationToken: stoppingToken);

                _logger.LogInformation(
                    "RabbitMQ Consumer is listening on queue {QueueName}",
                    QueueName);

                await Task.WhenAny(
                    shutdownSignal.Task,
                    Task.Delay(Timeout.Infinite, stoppingToken));
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "RabbitMQ Consumer failed. Retrying connection in 5 seconds.");

                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
                catch (OperationCanceledException)
                    when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
            }
        }
    }

    private static async Task DeclareTopologyAsync(
        IChannel channel,
        CancellationToken cancellationToken)
    {
        await channel.ExchangeDeclareAsync(
            exchange: ExchangeName,
            type: ExchangeType.Fanout,
            durable: true,
            autoDelete: false,
            cancellationToken: cancellationToken);

        await channel.ExchangeDeclareAsync(
            exchange: RetryExchange,
            type: ExchangeType.Direct,
            durable: true,
            autoDelete: false,
            cancellationToken: cancellationToken);

        await channel.ExchangeDeclareAsync(
            exchange: DeadLetterExchange,
            type: ExchangeType.Direct,
            durable: true,
            autoDelete: false,
            cancellationToken: cancellationToken);

        var mainQueueArguments = new Dictionary<string, object?>
        {
            ["x-dead-letter-exchange"] = DeadLetterExchange,
            ["x-dead-letter-routing-key"] = DeadLetterRoutingKey
        };

        await channel.QueueDeclareAsync(
            queue: QueueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: mainQueueArguments,
            cancellationToken: cancellationToken);

        var retryQueueArguments = new Dictionary<string, object?>
        {
            ["x-message-ttl"] = 5000,
            ["x-dead-letter-exchange"] = RetryExchange,
            ["x-dead-letter-routing-key"] = QueueName
        };

        await channel.QueueDeclareAsync(
            queue: RetryQueue,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: retryQueueArguments,
            cancellationToken: cancellationToken);

        await channel.QueueDeclareAsync(
            queue: DeadLetterQueue,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null,
            cancellationToken: cancellationToken);

        await channel.QueueBindAsync(
            queue: QueueName,
            exchange: ExchangeName,
            routingKey: string.Empty,
            cancellationToken: cancellationToken);

        await channel.QueueBindAsync(
            queue: QueueName,
            exchange: RetryExchange,
            routingKey: QueueName,
            cancellationToken: cancellationToken);

        await channel.QueueBindAsync(
            queue: DeadLetterQueue,
            exchange: DeadLetterExchange,
            routingKey: DeadLetterRoutingKey,
            cancellationToken: cancellationToken);
    }

    private async Task HandleMessageAsync(
        IChannel channel,
        BasicDeliverEventArgs eventArgs,
        CancellationToken stoppingToken)
    {
        try
        {
            await ProcessMessageAsync(eventArgs.Body, stoppingToken);

            await channel.BasicAckAsync(
                deliveryTag: eventArgs.DeliveryTag,
                multiple: false,
                cancellationToken: stoppingToken);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Invalid JSON message. Sending to DLQ.");

            await channel.BasicNackAsync(
                deliveryTag: eventArgs.DeliveryTag,
                multiple: false,
                requeue: false,
                cancellationToken: stoppingToken);
        }
        catch (InvalidDataException ex)
        {
            _logger.LogError(ex, "Invalid POI event. Sending to DLQ.");

            await channel.BasicNackAsync(
                deliveryTag: eventArgs.DeliveryTag,
                multiple: false,
                requeue: false,
                cancellationToken: stoppingToken);
        }
        catch (Exception ex)
        {
            var retryCount = GetRetryCount(eventArgs.BasicProperties);

            if (retryCount >= MaxRetries)
            {
                _logger.LogError(
                    ex,
                    "Message failed after {RetryCount} retries. Sending to DLQ.",
                    retryCount);

                await channel.BasicNackAsync(
                    deliveryTag: eventArgs.DeliveryTag,
                    multiple: false,
                    requeue: false,
                    cancellationToken: stoppingToken);

                return;
            }

            try
            {
                var retryProperties = new BasicProperties
                {
                    Headers = new Dictionary<string, object?>
                    {
                        ["x-retry-count"] = retryCount + 1
                    }
                };

                await channel.BasicPublishAsync(
                    exchange: string.Empty,
                    routingKey: RetryQueue,
                    mandatory: false,
                    basicProperties: retryProperties,
                    body: eventArgs.Body,
                    cancellationToken: stoppingToken);

                await channel.BasicAckAsync(
                    deliveryTag: eventArgs.DeliveryTag,
                    multiple: false,
                    cancellationToken: stoppingToken);

                _logger.LogWarning(
                    ex,
                    "Message failed. Scheduled retry {RetryCount}/{MaxRetries}.",
                    retryCount + 1,
                    MaxRetries);
            }
            catch (Exception retryException)
            {
                _logger.LogError(
                    retryException,
                    "Could not schedule retry. Requeueing original message.");

                await channel.BasicNackAsync(
                    deliveryTag: eventArgs.DeliveryTag,
                    multiple: false,
                    requeue: true,
                    cancellationToken: stoppingToken);
            }
        }
    }

    private async Task ProcessMessageAsync(
        ReadOnlyMemory<byte> body,
        CancellationToken stoppingToken)
    {
        var json = Encoding.UTF8.GetString(body.Span);

        var message = JsonSerializer.Deserialize<PoiEventMessage>(
            json,
            JsonOptions);

        if (message is null ||
            string.IsNullOrWhiteSpace(message.EventName) ||
            message.Data.ValueKind != JsonValueKind.Object)
        {
            throw new InvalidDataException(
                "Message is missing eventName or data.");
        }

        var eventName = message.EventName.ToUpperInvariant();

        if (eventName is not "POI_CREATED"
            and not "POI_UPDATED"
            and not "POI_DELETED")
        {
            throw new InvalidDataException(
                $"Unsupported POI event: {message.EventName}");
        }

        var data = message.Data.Deserialize<PoiEventData>(JsonOptions);

        if (data is null || data.PoiId <= 0)
        {
            throw new InvalidDataException("POI event has an invalid poiId.");
        }

        await using var scope = _scopeFactory.CreateAsyncScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<AiDbContext>();

        var record = await dbContext.PoiRecords.SingleOrDefaultAsync(
            p => p.PoiId == data.PoiId,
            stoppingToken);

        switch (eventName)
        {
            case "POI_CREATED":
            case "POI_UPDATED":
                ValidateUpsertData(data);

                if (record is null)
                {
                    record = new PoiRecord { PoiId = data.PoiId };
                    dbContext.PoiRecords.Add(record);
                }

                record.Name = data.Name!;
                record.Description = data.Description!;
                record.Location = data.Location!;
                record.Latitude = data.Latitude;
                record.Longitude = data.Longitude;
                record.IsActive = data.IsActive!.Value;

                await dbContext.SaveChangesAsync(stoppingToken);

                _logger.LogInformation(
                    "{EventName} processed for POI {PoiId}.",
                    eventName,
                    data.PoiId);
                break;

            case "POI_DELETED":
                if (record is null)
                {
                    _logger.LogInformation(
                        "POI {PoiId} was not found for deletion. No action needed.",
                        data.PoiId);
                    return;
                }

                record.IsActive = false;
                await dbContext.SaveChangesAsync(stoppingToken);

                _logger.LogInformation(
                    "POI {PoiId} marked inactive after POI_DELETED.",
                    data.PoiId);
                break;
        }
    }   

    private static void ValidateUpsertData(PoiEventData data)
    {
        if (string.IsNullOrWhiteSpace(data.Name) ||
            string.IsNullOrWhiteSpace(data.Description) ||
            string.IsNullOrWhiteSpace(data.Location) ||
            data.IsActive is null)
        {
            throw new InvalidDataException(
                $"POI {data.PoiId} is missing required fields.");
        }
    }

    private static int GetRetryCount(IReadOnlyBasicProperties properties)
    {
        if (properties.Headers is null ||
            !properties.Headers.TryGetValue("x-retry-count", out var value))
        {
            return 0;
        }

        return value switch
        {
            byte b => b,
            sbyte sb => sb,
            short s => s,
            int i => i,
            long l when l >= 0 && l <= int.MaxValue => (int)l,
            byte[] bytes when int.TryParse(
                Encoding.UTF8.GetString(bytes),
                out var parsed) => parsed,
            _ => 0
        };
    }
}
