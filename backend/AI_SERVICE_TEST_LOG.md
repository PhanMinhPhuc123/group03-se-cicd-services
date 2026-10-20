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


## TC07 – Retry Mechanism and Dead Letter Queue Verification

### Test Environment
- Application: AiService
- Message Broker: RabbitMQ 4
- Database: PostgreSQL 17 with pgvector
- Container Orchestration: Docker Compose
- Main Queue: `ai.poi.events`
- Retry Queue: `ai.poi.events.retry`
- Dead Letter Queue: `ai.poi.events.dlq`

### Test Case 1: Successful POI Event Processing

**Procedure:**
1. Start all Docker Compose services.
2. Publish a valid `POI_CREATED` event to the configured RabbitMQ exchange.
3. Check the AiService application logs.
4. Query the `PoiRecords` table in PostgreSQL.

**Expected Result:**
- AiService consumes and processes the event.
- The corresponding POI record is inserted into PostgreSQL.

**Actual Result:**
- The application logged `POI_CREATED processed for POI 99009`.
- The database query confirmed that POI 99009 exists with the expected name and active status.

**Status:** PASSED

### Test Case 2: Retry Mechanism During Database Unavailability

**Procedure:**
1. Stop the PostgreSQL service using `docker compose stop postgres`.
2. Publish a valid POI event with a unique POI ID.
3. Observe the AiService application logs.
4. Restart PostgreSQL using `docker compose start postgres`.
5. Verify database readiness and inspect the application logs.

**Expected Result:**
- Database-related processing failures trigger the retry mechanism.
- The application schedules retries up to the configured maximum.
- Once PostgreSQL becomes available, the event can be processed successfully.

**Actual Result:**
- The logs recorded `Message failed. Scheduled retry 1/3`.
- The logs subsequently recorded `Message failed. Scheduled retry 2/3` and `Message failed. Scheduled retry 3/3`.
- After PostgreSQL became available, the application logged `POI_CREATED processed for POI 99009`.
- The corresponding database record was verified.

**Status:** PASSED

### Test Case 3: Invalid JSON and Dead Letter Queue

**Procedure:**
1. Publish a deliberately malformed JSON message to the appropriate RabbitMQ exchange and routing key.
2. Inspect the application logs for JSON validation errors.
3. Inspect the Dead Letter Queue and verify the message payload and dead-letter metadata.

**Expected Result:**
- The consumer rejects malformed JSON without repeatedly retrying it.
- RabbitMQ routes the rejected message to the configured Dead Letter Queue.
- The DLQ retains the rejected message for inspection.

**Actual Result:**
- A previously inspected DLQ message contained the malformed payload `{ invalid json`.
- RabbitMQ displayed dead-letter metadata indicating that the message had been rejected.
- A new, independent end-to-end DLQ test has not yet been confirmed.

**Status:** PARTIALLY VERIFIED

### Overall Result

The successful POI processing and database recovery retry scenarios have been verified. The invalid JSON and Dead Letter Queue scenario requires one final verification using a newly published malformed message.

**Actual Result:**
- A malformed JSON message was published to the `poi.events` exchange using the `ai.poi.events` routing key.
- The application log confirmed: `Invalid JSON message. Sending to DLQ.`
- The message was rejected by the consumer and routed to `ai.poi.events.dlq`.
- The DLQ message count increased from 1 to 2.
- The main queue `ai.poi.events` remained empty, with one active consumer.
- The retry queue `ai.poi.events.retry` remained empty.

**Status:** PASSED