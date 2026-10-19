
# AiService Integration Test Log

## Environment
- Branch: feature/ai-rabbitmq-consumer
- Host port: 18080
- Exchange: poi.events
- Exchange type: fanout
- Queue: ai.poi.events
- Database: ai_database
- Migration: AddPoiRecord

## Test Cases

| ID | Test case | Expected result | Actual result | Status |
|---|---|---|---|---|
| TC01 | Apply database migration | PoiRecords table exists | Migration applied; table verified | Passed |
| TC02 | Start AiService and RabbitMQ Consumer | Consumer connects and listens on ai.poi.events | Pending | Pending |
| TC03 | Publish POI_CREATED | POI record is created or updated | Pending | Pending |
| TC04 | Publish POI_UPDATED | Existing POI record is updated | Pending | Pending |
| TC05 | Publish POI_DELETED | Existing POI record is marked inactive | Pending | Pending |
| TC06 | Publish invalid JSON | Message is rejected and routed to DLQ | Pending | Pending |
| TC07 | Simulate processing failure | Message is retried with a bounded retry count | Pending | Pending |
| TC08 | Restart RabbitMQ | Consumer reconnects after RabbitMQ becomes available | Pending | Pending |

## Evidence
- Docker logs:
- RabbitMQ Management screenshots:
- PostgreSQL verification:
- Related commits:
