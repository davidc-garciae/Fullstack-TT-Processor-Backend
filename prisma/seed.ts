// prisma/seed.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const buildDatabaseUrl = (): string => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (!process.env.DB_URL || !process.env.DB_USERNAME || !process.env.DB_PASSWORD) {
    throw new Error('Missing DB_URL/DB_USERNAME/DB_PASSWORD for seeding');
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

const datasourceUrl = buildDatabaseUrl();
const adapter = new PrismaPg({ connectionString: datasourceUrl });
const prisma = new PrismaClient({ adapter });

// el resto del archivo se queda igual
async function main() {
  const products = [
    {
      name: 'Wireless Headphones',
      description: 'Noise-cancelling over-ear headphones',
      priceCents: 259000,
      currency: 'COP',
      stock: 15,
    },
    {
      name: 'Mechanical Keyboard',
      description: 'Compact keyboard with tactile switches',
      priceCents: 349000,
      currency: 'COP',
      stock: 9,
    },
  ];

  for (const item of products) {
    const product = await prisma.product.create({
      data: {
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        currency: item.currency,
      },
    });
    await prisma.stockItem.create({
      data: {
        productId: product.id,
        availableUnits: item.stock,
        reservedUnits: 0,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });