import { PrismaClient } from '@prisma/client';

const globalAny = globalThis;

export const prisma =
  globalAny.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalAny.prisma = prisma;
