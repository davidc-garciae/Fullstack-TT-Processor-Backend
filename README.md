# Backend - FullStack TT

Backend API for a product checkout flow with card payment processing in sandbox mode, implemented with **NestJS + TypeScript + PostgreSQL** using **Hexagonal Architecture (Ports & Adapters)**. Suitable for production deployments with clear boundaries for future scaling.

## Stack

- NestJS 11
- TypeScript
- PostgreSQL
- Prisma ORM
- Jest (unit + e2e)
- Swagger/OpenAPI

## Architecture

The backend is organized into clear layers:

- **Domain**: entities and contracts (ports)
- **Application**: use cases (`preview`, `create pending`, `pay`, `get status`)
- **Infrastructure**: PostgreSQL adapters and payment processor adapter
- **Interface**: REST controllers and DTOs

```mermaid
flowchart TD
  ClientApp[Client App] --> ApiControllers[API Controllers]
  ApiControllers --> ApplicationUseCases[Application Use Cases]
  ApplicationUseCases --> DomainPorts[Domain Ports]
  DomainPorts --> PostgresAdapters[Postgres Adapters]
  DomainPorts --> ProcessorAdapter[Processor Adapter]
  PostgresAdapters --> PostgreSQL[(PostgreSQL)]
  ProcessorAdapter --> ProcessorSandbox[Processor Sandbox]
```

**Module layout**: `src/modules/products`, `checkout`, `transactions`, `customers`, `deliveries`, `health`; `src/shared/domain`, `application`, `infrastructure`.

## Design Decisions

### Railway Oriented Programming (ROP)

Use cases return explicit `Ok/Fail` results instead of relying on exceptions for normal business decisions. This makes business flows deterministic and easier to test.

### Modular Monolith over Microservices

A modular monolith was selected for scope and free-tier constraints:

- Lower operational complexity
- Lower deployment cost
- Faster delivery while preserving clean domain boundaries

Modules and ports are designed to allow future extraction into microservices if needed.

## Data Model and Database

Transactions and transaction events are stored in PostgreSQL for strong consistency (ACID), referential integrity, and auditability. This choice is appropriate for production payment flows.

Main tables:

- `products`, `stock_items`
- `customers`, `deliveries`
- `transactions`, `transaction_events`

Key rules: unique `transactions.reference` and `transactions.idempotency_key`; indexes on `status`, `reference`, and `created_at`.

```mermaid
erDiagram
  products ||--o| stock_items : "has"
  products ||--o{ transactions : "ordered in"
  customers ||--o{ deliveries : "has"
  customers ||--o{ transactions : "places"
  deliveries ||--o{ transactions : "ships to"
  transactions ||--o{ transaction_events : "emits"
  products {
    uuid id PK
    string name
    int price_cents
    string currency
    boolean is_active
  }
  stock_items {
    uuid id PK
    uuid product_id FK
    int available_units
    int reserved_units
  }
  customers {
    uuid id PK
    string full_name
    string email
  }
  deliveries {
    uuid id PK
    uuid customer_id FK
    string address_line1
    string city
    string country
  }
  transactions {
    uuid id PK
    string reference UK
    string idempotency_key UK
    uuid product_id FK
    uuid customer_id FK
    uuid delivery_id FK
    string status
  }
  transaction_events {
    uuid id PK
    uuid transaction_id FK
    string event_type
    json payload_json
  }
```

### Payment Flow (atomic finalization)

```mermaid
flowchart LR
  Create[Create Transaction] --> Pay[Pay]
  Pay --> Gateway[Payment Gateway]
  Gateway --> Finalize[Finalize or Update Status]
  Finalize --> Event[Create Event]
```

Approved payments: stock decrement, status update, and event insert run in a single DB transaction. Failed or declined payments only update status and create an event.

## Deployment

Production topology: browser loads the frontend (Vercel); frontend calls the backend API (Render); backend uses Neon PostgreSQL. CORS and health check are configured for this setup.

```mermaid
flowchart LR
  subgraph client [Client]
    Browser[Browser]
  end
  subgraph frontend [Frontend]
    Vercel[Vercel SPA]
  end
  subgraph backend [Backend]
    Render[Render API]
  end
  subgraph data [Data]
    Neon[(Neon PostgreSQL)]
  end
  Browser --> Vercel
  Vercel -->|"VITE_API_BASE_URL"| Render
  Render -->|"DATABASE_URL"| Neon
  Render -->|"Health: /api/v1/health"| Render
  Vercel -->|"CORS_ORIGINS"| Render
```

### Deploy on Render

1. Create a new **Web Service** and connect this repository.
2. Use the **Blueprint** ([render.yaml](render.yaml)) or set manually:
   - **Build Command:** `pnpm install --frozen-lockfile && pnpm prisma generate && pnpm prisma migrate deploy && pnpm run build`
   - **Start Command:** `pnpm run start:prod`
3. Set **Health Check Path:** `/api/v1/health`
4. Use a **PostgreSQL** database (e.g. Neon); set `DATABASE_URL` in the service environment (e.g. `postgresql://USER:PASSWORD@HOST/DB?sslmode=require`).
5. Required env vars (see [.env.example](.env.example) for full list): `NODE_ENV=production`, `PORT` (auto), `DATABASE_URL`, `CORS_ORIGINS` (frontend origin, e.g. `https://your-frontend.vercel.app`), `PROCESSOR_BASE_URL`, `PAYMENT_PROCESSOR_PUBLIC_KEY`, `PAYMENT_PROCESSOR_PRIVATE_KEY`, `PAYMENT_PROCESSOR_INTEGRITY_KEY`.
6. Migrations run during build; optionally seed once via shell: `pnpm prisma db seed`.

Frontend deployment is documented in the frontend repository README.

## API Reference

Base URL: `http://localhost:3000/api/v1` (or your Render URL in production)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/products` | List active products with stock |
| GET | `/api/v1/products/:id` | Get product by id |
| POST | `/api/v1/checkout/preview` | Preview checkout totals |
| POST | `/api/v1/transactions` | Create pending transaction |
| POST | `/api/v1/transactions/:reference/pay` | Pay transaction |
| GET | `/api/v1/transactions/:reference` | Get transaction status |
| POST | `/api/v1/customers` | Create customer |
| POST | `/api/v1/deliveries` | Create delivery |

**Swagger UI:** `http://localhost:3000/api/docs`

## Environment Variables

Copy [.env.example](.env.example) into `.env`. Key variables: `PORT`, `DATABASE_URL` (or `DB_URL` + `DB_USERNAME` + `DB_PASSWORD`), `CORS_ORIGINS`, and Processor-related keys. See `.env.example` for optional keys (paths, polling, mock gateway).

## Main Scripts

- `pnpm install` — Install dependencies
- `pnpm prisma:generate` — Generate Prisma client
- `pnpm prisma:migrate` — Run migrations (dev)
- `pnpm prisma:seed` — Seed database
- `pnpm start:dev` — Start in development
- `pnpm run start:prod` — Start production server (after build)
- `pnpm build` — Build for production
- `pnpm lint` — Lint and fix
- `pnpm test` — Unit tests
- `pnpm test:e2e` — E2E tests
- `pnpm test:cov` — Coverage (threshold 80%)

## Business Guarantees

- **Idempotent transaction creation** via `idempotencyKey`
- **Atomic approved finalization**: stock decrement + approved status + event in one DB transaction
- **Retry-safe payment flow** by transaction reference and explicit state handling
- **Sensitive-data safety**: no PAN/CVV persistence; masked card details in processor payload traces

## Postman

- Collection: `postman/fullstack-tt.postman_collection.json`
- Environment: `postman/fullstack-tt.postman_environment.json`

Suggested sequence: List Products → Checkout Preview → Create Pending Transaction → Pay Transaction → Get Transaction Status.

## Security Baseline

- Global `ValidationPipe` (`whitelist`, `transform`, `forbidNonWhitelisted`)
- `helmet` enabled
- CORS restricted via `CORS_ORIGINS`
- Throttling enabled
- Strict card-format validation in DTOs
- No raw sensitive payload persistence

## Testing

Unit tests cover use cases; E2E covers health. Run `pnpm test:cov`; global threshold is 80%.

## Notes

- Sandbox processor mode is expected for all tests.
- Initial migration: `prisma/migrations/0001_init/migration.sql`.
- `prisma.config.ts` and `PrismaService` support `DATABASE_URL` directly or derivation from `DB_URL` + `DB_USERNAME` + `DB_PASSWORD`.
