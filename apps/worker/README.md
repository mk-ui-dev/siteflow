# SiteFlow Worker

BullMQ background job processor.

## Structure

```
apps/worker/
├── src/
│   ├── lib/             # Queue setup, DB connection
│   ├── processors/      # Event processors (outbox)
│   ├── jobs/            # Scheduled jobs
│   ├── services/        # Notification, email services
│   └── index.ts         # Worker entry point
├── tests/
└── package.json
```

## Coming in Phase 9
