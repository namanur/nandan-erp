// scripts/seed.js
// Run with: node scripts/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  console.log("Seeding database...");

  const TENANT_ID = process.env.TENANT_ID || "local-tenant";

  const username = "admin";
  const password = "admin123"; // change after first run
  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { username },
    update: { password: hashed, tenantId: TENANT_ID },
    create: { username, password: hashed, role: "admin", tenantId: TENANT_ID },
  });
  console.log("Admin user created:", username);

  const categories = [
    { name: "Plates", slug: "plates" },
    { name: "Glassware", slug: "glassware" },
    { name: "Cookware", slug: "cookware" },
    { name: "Utensils", slug: "utensils" }
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, tenantId: TENANT_ID },
      create: { name: c.name, slug: c.slug, tenantId: TENANT_ID },
    });
  }
  console.log("Categories seeded.");

  const products = [
    { title: "Ceramic Dinner Plate (10in)", sku: "NT-PLT001", price: 120.00, stock: 50, categorySlug: "plates" },
    { title: "Glass Tumbler 300ml", sku: "NT-GLS001", price: 60.00, stock: 120, categorySlug: "glassware" },
    { title: "Stainless Steel Kadai 3L", sku: "NT-KAD001", price: 850.00, stock: 20, categorySlug: "cookware" },
    { title: "Non-stick Tawa 10in", sku: "NT-TWA001", price: 320.00, stock: 35, categorySlug: "cookware" },
    { title: "Bamboo Cutting Board (Medium)", sku: "NT-CBD001", price: 220.00, stock: 40, categorySlug: "utensils" }
  ];

  for (const p of products) {
    const cat = await prisma.category.findUnique({ where: { slug: p.categorySlug }});
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: { title: p.title, price: p.price, stock: p.stock, categoryId: cat ? cat.id : undefined, tenantId: TENANT_ID },
      create: { title: p.title, sku: p.sku, price: p.price, stock: p.stock, categoryId: cat ? cat.id : undefined, tenantId: TENANT_ID },
    });
  }
  console.log("Products seeded.");

  await prisma.$disconnect();
  console.log("Seeding finished.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
