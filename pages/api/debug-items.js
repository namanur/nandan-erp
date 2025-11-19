// pages/api/debug-items.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // return a couple of rows to test connectivity
    const sample = await prisma.product.findMany({ take: 6 });
    const count = await prisma.product.count();
    res.status(200).json({ ok: true, count, sample });
  } catch (err) {
    console.error('debug-items error:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await prisma.$disconnect();
  }
}
