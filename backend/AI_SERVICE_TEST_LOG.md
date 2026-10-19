# AiService Integration Test Log

## 1. Test Environment

- **Git Branch:** `feature/ai-rabbitmq-consumer`
- **AiService Host Port:** `18080`
- **Exchange:** `poi.events`
- **Exchange Type:** `fanout`
- **Main Queue:** `ai.poi.events`
- **Database:** `ai_database`
- **Migration:** `AddPoiRecord`

## 2. Test Results

| ID | Test Case | Actual Result | Status |
|---|---|---|---|
| TC01 | Apply database migration | The `PoiRecords` table was created and verified in PostgreSQL. | Passed |
| TC02 | Start AiService and RabbitMQ Consumer | The consumer connected to RabbitMQ and started listening on the `ai.poi.events` queue. | Passed |
| TC03 | Test `POI_CREATED` event | A POI record was created in PostgreSQL. | Passed |
| TC04 | Test `POI_UPDATED` event | The existing POI record was updated in PostgreSQL. | Passed |
| TC05 | Test `POI_DELETED` event | The POI record was marked as inactive (`IsActive = false`). | Passed |
| TC06 | Publish invalid JSON | The consumer logged a JSON parsing error, and the invalid message was routed to the dead-letter queue (DLQ). | Passed |
| TC07 | Test retry mechanism for processing failures | The retry limit and final message handling have not yet been fully verified. | Pending |
| TC08 | Restart RabbitMQ | The consumer logged connection failures while RabbitMQ was unavailable and resumed listening after RabbitMQ restarted. | Passed |

## 3. Test Evidence

- **Docker Logs:** Confirmed consumer startup, successful processing of POI events, and handling of invalid JSON messages.
- **RabbitMQ:** Confirmed that the main queue has an active consumer and that the DLQ contains a rejected message.
- **PostgreSQL:** Verified that the POI record was created, updated, and marked as inactive.
- **Connection Recovery:** Logs confirmed connection failures while RabbitMQ was stopped and successful consumer reconnection after RabbitMQ restarted.
- **Git Commit:** `6beeda2` — `feat: consume POI events in AiService`

## 4. Notes

TC07 requires additional testing using a retryable processing failure. The test must verify that the message is retried up to the configured limit (`MaxRetries = 3`) and is eventually routed to the DLQ when the retry limit is exceeded.

TC07 remains **Pending** until the retry behavior and final message handling have been verified with sufficient evidence.