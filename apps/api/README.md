# SiteFlow API

Fastify backend application.

## Structure

```
apps/api/
├── src/
│   ├── config/          # Configuration (env, db, redis, minio)
│   ├── lib/             # Utilities (db, crypto, auth, logger)
│   ├── middleware/      # Fastify middleware
│   ├── plugins/         # Fastify plugins
│   ├── repos/           # Data access layer (DAOs)
│   ├── services/        # Business logic
│   ├── routes/          # API endpoints
│   └── server.ts        # Server entry point
├── tests/           # Integration tests
└── package.json
```

## Coming in Phase 4-8
