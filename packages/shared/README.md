# @siteflow/shared

Shared TypeScript types, Zod schemas, enums, and constants.

Used by both `api`, `worker`, and `web` packages.

## Structure

```
packages/shared/
├── src/
│   ├── types/           # TypeScript interfaces
│   ├── schemas/         # Zod validation schemas
│   ├── enums/           # Enums (synced with DB)
│   ├── errors/          # Error codes and classes
│   ├── constants/       # Business constants
│   └── index.ts         # Main export
└── package.json
```

## Coming in Phase 3
