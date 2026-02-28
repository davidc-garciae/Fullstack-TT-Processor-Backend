import { registerAs } from '@nestjs/config';

export default registerAs('processor', () => ({
  baseUrl:
    process.env.PROCESSOR_BASE_URL ?? 'https://api-sandbox.co.uat.processor.dev/v1',
  publicKey: process.env.PAYMENT_PROCESSOR_PUBLIC_KEY ?? '',
  privateKey: process.env.PAYMENT_PROCESSOR_PRIVATE_KEY ?? '',
  integrityKey: process.env.PAYMENT_PROCESSOR_INTEGRITY_KEY ?? '',
  useMock: process.env.PAYMENT_PROCESSOR_USE_MOCK === 'true',
  tokenizePath: process.env.PAYMENT_PROCESSOR_TOKENIZE_PATH ?? '/tokens/cards',
  merchantsPath:
    process.env.PAYMENT_PROCESSOR_MERCHANTS_PATH ?? '/merchants/{{publicKey}}',
  transactionsPath:
    process.env.PAYMENT_PROCESSOR_TRANSACTIONS_PATH ?? '/transactions',
  /** Path to get transaction by id (e.g. Wompi). Use {{id}} placeholder. */
  transactionByIdPath:
    process.env.PAYMENT_PROCESSOR_TRANSACTION_BY_ID_PATH ?? '/transactions/{{id}}',
  /** Poll when status is PENDING: interval ms and max attempts (total wait = interval * maxAttempts). */
  pollIntervalMs: Number(process.env.PAYMENT_PROCESSOR_POLL_INTERVAL_MS) || 2000,
  pollMaxAttempts: Number(process.env.PAYMENT_PROCESSOR_POLL_MAX_ATTEMPTS) || 15,
}));
