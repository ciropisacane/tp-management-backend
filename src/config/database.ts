import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const buildDatabaseUrl = (): string => {
  const rawUrl = process.env.DATABASE_URL?.trim();

  if (!rawUrl) {
    throw new Error('DATABASE_URL is not set. Please configure your PostgreSQL connection string.');
  }

  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch (error) {
    console.warn('DATABASE_URL is not a valid URL. Falling back to raw string.', error);
    return rawUrl;
  }

  const host = url.hostname.toLowerCase();
  const isLocalHost = ['localhost', '127.0.0.1'].includes(host);
  const requiresSSL =
    process.env.NODE_ENV === 'production' ||
    process.env.FORCE_SSL === 'true' ||
    (!isLocalHost && !/sslmode=/i.test(rawUrl));

  if (requiresSSL && !/sslmode=/i.test(rawUrl)) {
    const separator = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${separator}sslmode=require`;
  }

  return rawUrl;
};

const databaseUrl = buildDatabaseUrl();

const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

export { prisma };

export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('Prisma Client disconnected');
});
