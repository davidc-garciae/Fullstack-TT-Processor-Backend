# Backend - FullStack TT Challenge

Backend API for a product checkout flow with card payment processing in sandbox mode, implemented with **NestJS + TypeScript + PostgreSQL** using **Hexagonal Architecture (Ports & Adapters)**.

## Stack

- NestJS 11
- TypeScript
- PostgreSQL
- Prisma ORM
- Jest (unit + e2e)
- Swagger/OpenAPI

## Architecture

The backend is organized into clear layers:

- `Domain`: entities and contracts (ports)
- `Application`: use cases (`preview`, `create pending`, `pay`, `get status`)
- `Infrastructure`: PostgreSQL adapters and payment processor adapter
- `Interface`: REST controllers and DTOs

```mermaid
flowchart TD
ClientApp[ClientApp] --> ApiControllers[ApiControllers]
ApiControllers --> ApplicationUseCases[ApplicationUseCases]
ApplicationUseCases --> DomainPorts[DomainPorts]
DomainPorts --> PostgresAdapters[PostgresAdapters]
DomainPorts --> ProcessorAdapter[ProcessorAdapter]
PostgresAdapters --> PostgreSQL[PostgreSQL]
ProcessorAdapter --> ProcessorSandbox[ProcessorSandbox]
```

## Why ROP and Modular Monolith

### Railway Oriented Programming (ROP)

Use cases return explicit `Ok/Fail` results instead of relying on exceptions for normal business decisions. This makes business flows deterministic and easier to test.

### Modular Monolith over Microservices

A modular monolith was selected for challenge scope and free-tier constraints:

- lower operational complexity,
- lower deployment cost,
- faster delivery while preserving clean domain boundaries.

Modules and ports are designed to allow future extraction into microservices if needed.

## Environment Variables

Copy `.env.example` into `.env`:

```env
PORT=3000

DB_URL=jdbc:postgresql://localhost:5433/fullstack-tt-db
DB_USERNAME=postgres
DB_PASSWORD=root
DATABASE_URL=postgresql://postgres:root@localhost:5433/fullstack-tt-db?schema=public

PAYMENT_PROCESSOR_UAT_URL=https://api.co.uat.processor.dev/v1
PAYMENT_PROCESSOR_SANDBOX_URL=https://api-sandbox.co.uat.processor.dev/v1
PROCESSOR_BASE_URL=https://api-sandbox.co.uat.processor.dev/v1
PAYMENT_PROCESSOR_LOGIN_URL=https://login.staging.processor.dev/
PAYMENT_PROCESSOR_USER=smltrs00
PAYMENT_PROCESSOR_PASSWORD=ChallengeProcessor123*
PAYMENT_PROCESSOR_PUBLIC_KEY=pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7
PAYMENT_PROCESSOR_PRIVATE_KEY=prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg
PAYMENT_PROCESSOR_EVENTS_KEY=stagtest_events_2PDUmhMywUkvb1LvxYnayFbmofT7w39N
PAYMENT_PROCESSOR_INTEGRITY_KEY=stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp
PAYMENT_PROCESSOR_TOKENIZE_PATH=/tokens/cards
PAYMENT_PROCESSOR_MERCHANTS_PATH=/merchants/{{publicKey}}
PAYMENT_PROCESSOR_TRANSACTIONS_PATH=/transactions
```

## Main Scripts

- `pnpm install`
- `pnpm prisma:generate`
- `pnpm prisma:migrate`
- `pnpm prisma:seed`
- `pnpm start:dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm test:cov`

## Deploy on Render

1. Create a new **Web Service** and connect this repository.
2. Use the **Blueprint** (root `render.yaml`) or set manually:
   - **Build Command:** `pnpm install --frozen-lockfile && pnpm prisma generate && pnpm build`
   - **Start Command:** `pnpm start:prod`
3. Create a **PostgreSQL** database in Render and set `DATABASE_URL` in the service environment.
4. Set required env vars (no secrets in git): `NODE_ENV=production`, `PORT` (auto), `DATABASE_URL`, `PROCESSOR_BASE_URL`, `PAYMENT_PROCESSOR_PUBLIC_KEY`, `PAYMENT_PROCESSOR_PRIVATE_KEY`, `PAYMENT_PROCESSOR_INTEGRITY_KEY`. See `.env.example` for optional keys (Wompi paths, polling, mock).
5. After first deploy, run migrations and seed from the shell or a one-off job: `pnpm prisma migrate deploy` and `pnpm prisma:seed` (if using Render shell, use the same `DATABASE_URL`).

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

- `GET /health`
- `GET /products`
- `GET /products/:id`
- `POST /checkout/preview`
- `POST /transactions`
- `POST /transactions/:reference/pay`
- `GET /transactions/:reference`
- `POST /customers`
- `POST /deliveries`

Swagger UI: `http://localhost:3000/api/docs`

## Business Guarantees

- **Idempotent transaction creation** by `idempotencyKey`.
- **Atomic approved finalization**: stock decrement + approved status + event are committed in one DB transaction.
- **Retry-safe payment flow** by transaction reference and explicit state handling.
- **Sensitive-data safety**: no PAN/CVV persistence and masked card details in processor payload traces.

## Postman

- Collection: `postman/fullstack-tt.postman_collection.json`
- Environment: `postman/fullstack-tt.postman_environment.json`

Suggested sequence:
1. `List Products`
2. `Checkout Preview`
3. `Create Pending Transaction`
4. `Pay Transaction`
5. `Get Transaction Status`

## Data Model (PostgreSQL)

Main tables:

- `products`
- `stock_items`
- `customers`
- `deliveries`
- `transactions`
- `transaction_events`

Key rules:

- unique `transactions.reference`
- unique `transactions.idempotency_key`
- indexed `status`, `reference`, and `created_at`

## Security Baseline

- Global `ValidationPipe` (`whitelist`, `transform`, `forbidNonWhitelisted`)
- `helmet` enabled
- CORS enabled
- Throttling enabled
- strict card-format validation in DTOs
- no raw sensitive payload persistence

## Deployment Notes

Current low-cost setup is valid for the challenge:

- Backend: Render
- Frontend: Vercel
- Database: Neon PostgreSQL

Target AWS architecture can evolve to:

- `Route 53` + `CloudFront` + `API Gateway`
- `ALB` + `ECS`
- `RDS PostgreSQL`
- `Secrets Manager` + Cloud security controls

## Notes

- Sandbox processor mode is expected for all tests.
- Initial migration: `prisma/migrations/0001_init/migration.sql`.
- `prisma.config.ts` and `PrismaService` support `DATABASE_URL` directly or derivation from `DB_URL + DB_USERNAME + DB_PASSWORD`.
# Backend - FullStack TT Challenge

Backend API para el flujo de onboarding de compra con pago por tarjeta en Processor (sandbox), implementado con **NestJS + TypeScript + PostgreSQL** usando **arquitectura hexagonal (Ports & Adapters)**.

## Stack

- NestJS 11
- TypeScript
- PostgreSQL
- Prisma ORM
- Jest (unit + e2e)
- Swagger/OpenAPI

## Arquitectura

La solución separa el sistema en capas:

- `Domain`: entidades y contratos (puertos).
- `Application`: casos de uso (`preview`, `create pending`, `pay`, `get status`).
- `Infrastructure`: adapters de PostgreSQL (Prisma) y gateway Processor.
- `Interface`: controllers REST y DTOs.

```mermaid
flowchart TD
ClientApp[ClientApp] --> ApiControllers[ApiControllers]
ApiControllers --> ApplicationUseCases[ApplicationUseCases]
ApplicationUseCases --> DomainPorts[DomainPorts]
DomainPorts --> PostgresAdapters[PostgresAdapters]
DomainPorts --> ProcessorAdapter[ProcessorAdapter]
PostgresAdapters --> PostgreSQL[PostgreSQL]
ProcessorAdapter --> ProcessorSandbox[ProcessorSandbox]
```

## Estructura principal

- `src/modules/products`
- `src/modules/checkout`
- `src/modules/transactions`
- `src/modules/customers`
- `src/modules/deliveries`
- `src/shared/domain`
- `src/shared/application`
- `src/shared/infrastructure`

## Variables de entorno

Copiar `.env.example` a `.env` y validar:

```env
PORT=3000
DB_URL=jdbc:postgresql://localhost:5433/fullstack-tt-db
DB_USERNAME=postgres
DB_PASSWORD=root
DATABASE_URL=postgresql://postgres:root@localhost:5433/fullstack-tt-db?schema=public
PAYMENT_PROCESSOR_UAT_URL=https://api.co.uat.processor.dev/v1
PAYMENT_PROCESSOR_SANDBOX_URL=https://api-sandbox.co.uat.processor.dev/v1
PROCESSOR_BASE_URL=https://api-sandbox.co.uat.processor.dev/v1
PAYMENT_PROCESSOR_LOGIN_URL=https://login.staging.processor.dev/
PAYMENT_PROCESSOR_USER=smltrs00
PAYMENT_PROCESSOR_PASSWORD=ChallengeProcessor123*
PAYMENT_PROCESSOR_PUBLIC_KEY=pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7
PAYMENT_PROCESSOR_PRIVATE_KEY=prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg
PAYMENT_PROCESSOR_EVENTS_KEY=stagtest_events_2PDUmhMywUkvb1LvxYnayFbmofT7w39N
PAYMENT_PROCESSOR_INTEGRITY_KEY=stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp
```

## Scripts

- `pnpm install`
- `pnpm prisma:generate`
- `pnpm prisma:migrate`
- `pnpm prisma:seed`
- `pnpm start:dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm test:cov`

## Endpoints

Base URL: `http://localhost:3000/api/v1`

- `GET /health`
- `GET /products`
- `GET /products/:id`
- `POST /checkout/preview`
- `POST /transactions`
- `POST /transactions/:reference/pay`
- `GET /transactions/:reference`
- `POST /customers`
- `POST /deliveries`

Swagger: `http://localhost:3000/api/docs`

## Postman

- Coleccion incluida en:
  - `postman/fullstack-tt.postman_collection.json`
- Flujo sugerido:
  1. `1. List Products`
  2. `3. Checkout Preview`
  3. `4. Create Pending Transaction`
  4. `5. Pay Transaction`
  5. `6. Get Transaction Status`

## Modelo de datos

Tablas principales:

- `products`
- `stock_items`
- `customers`
- `deliveries`
- `transactions`
- `transaction_events`

Reglas clave:

- `transactions.reference` único.
- `transactions.idempotency_key` único.
- índices por `status`, `reference` y `created_at`.

## Cobertura de pruebas

Se incluye suite de pruebas unitarias para casos de uso y prueba e2e de salud.

- Resultado actual: `pnpm test:cov` supera el umbral global de **80%**.

## Seguridad aplicada

- `ValidationPipe` global (`whitelist`, `transform`, `forbidNonWhitelisted`).
- `helmet` habilitado.
- CORS habilitado.
- Throttling global básico.
- No se persiste PAN/CVV completos.

## Decisiones arquitectonicas

### Railway Oriented Programming (ROP)

Se aplica ROP de forma pragmatica en los casos de uso mediante resultados tipados (`Ok/Fail`), para:

- evitar excepciones como mecanismo de control de flujo;
- hacer explicitos los caminos de error esperados;
- simplificar testing de escenarios de negocio.

### Monolito modular vs microservicios

Se eligio **monolito modular** (NestJS + modulos + hexagonal) para este challenge por:

- restricciones reales del tier gratuito (una sola instancia de backend);
- menor complejidad operativa (sin red entre servicios ni tracing distribuido);
- menor costo y mayor velocidad de entrega.

Esta base conserva limites claros por modulo/puerto para facilitar una futura extraccion a microservicios si el volumen crece.

## Plan de despliegue cloud (AWS)

### Arquitectura base propuesta

1. `Route 53` para DNS.
2. `CloudFront` como capa edge y cache de contenido estatico (frontend).
3. `API Gateway` para exponer y proteger la API publica.
4. `ALB` (Application Load Balancer) para enrutar trafico HTTP interno a servicios de backend.
5. `ECS` (con Fargate o EC2 launch type) para ejecutar contenedores del backend.
6. `RDS PostgreSQL` para datos transaccionales.
7. Variables sensibles en `Secrets Manager` y configuracion en Task Definitions.
8. Hardening con WAF/rate limit y politicas de seguridad en CloudFront/API Gateway.

### Donde encajan DynamoDB, S3 y Lambda

- `S3`: altamente recomendado para assets estaticos, exports y evidencias.
- `Lambda`: util para procesos event-driven (webhooks, tareas async, cron liviano).
- `DynamoDB`: opcional; encaja para workloads key-value de alta escala (sesiones, idempotencia, eventos), pero no reemplaza a RDS para este flujo transaccional principal.

### Alternativa actual de bajo costo

Para esta entrega, la opcion actual (`Render` backend, `Vercel` frontend, `Neon` DB) es totalmente valida por costo/tiempo y coherente con la decision de monolito modular.

## Notas

- El proyecto está preparado para entorno **Sandbox** de Processor.
- La migración inicial está en `prisma/migrations/0001_init/migration.sql`.
- `prisma.config.ts` y `PrismaService` soportan `DATABASE_URL` o construccion desde `DB_URL + DB_USERNAME + DB_PASSWORD`.
