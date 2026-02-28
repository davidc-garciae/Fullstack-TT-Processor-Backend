-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'ERROR');

-- CreateTable
CREATE TABLE "products" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price_cents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'COP',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_items" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "available_units" INTEGER NOT NULL DEFAULT 0,
  "reserved_units" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
  "id" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "document_type" TEXT NOT NULL,
  "document_number" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
  "id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "address_line1" TEXT NOT NULL,
  "address_line2" TEXT,
  "city" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "postal_code" TEXT NOT NULL,
  "instructions" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "delivery_id" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "product_amount_cents" INTEGER NOT NULL,
  "base_fee_cents" INTEGER NOT NULL,
  "delivery_fee_cents" INTEGER NOT NULL,
  "total_amount_cents" INTEGER NOT NULL,
  "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
  "processor_transaction_id" TEXT,
  "processor_status" TEXT,
  "failure_reason" TEXT,
  "idempotency_key" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_events" (
  "id" TEXT NOT NULL,
  "transaction_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "payload_json" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transaction_events_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "stock_items_product_id_key" ON "stock_items"("product_id");
CREATE INDEX "stock_items_available_units_idx" ON "stock_items"("available_units");
CREATE INDEX "customers_email_idx" ON "customers"("email");
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");
CREATE UNIQUE INDEX "transactions_idempotency_key_key" ON "transactions"("idempotency_key");
CREATE INDEX "transactions_status_idx" ON "transactions"("status");
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");
CREATE INDEX "transaction_events_created_at_idx" ON "transaction_events"("created_at");

-- FKs
ALTER TABLE "stock_items"
ADD CONSTRAINT "stock_items_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "deliveries"
ADD CONSTRAINT "deliveries_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_delivery_id_fkey"
FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transaction_events"
ADD CONSTRAINT "transaction_events_transaction_id_fkey"
FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
