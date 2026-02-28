import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const buildDatabaseUrl = (): string | undefined => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (
    !process.env.DB_URL ||
    !process.env.DB_USERNAME ||
    !process.env.DB_PASSWORD
  ) {
    return undefined;
  }

  const normalized = process.env.DB_URL.replace(/^jdbc:/, '');
  const parsed = new URL(normalized);
  parsed.username = process.env.DB_USERNAME;
  parsed.password = process.env.DB_PASSWORD;
  if (!parsed.searchParams.has('schema')) {
    parsed.searchParams.set('schema', 'public');
  }
  return parsed.toString();
};

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const datasourceUrl = buildDatabaseUrl();
    const adapter = datasourceUrl
      ? new PrismaPg({ connectionString: datasourceUrl })
      : undefined;
    super(adapter ? { adapter } : undefined);
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    await this.$connect();
  }
}
