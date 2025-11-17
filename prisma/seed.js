const { PrismaClient } = require('@prisma/client');
const { hashSync } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin password hash
  const adminPassword = 'admin123'; // Change this in production!
  const adminPasswordHash = hashSync(adminPassword, 12);
  console.log(`🔐 Admin password: ${adminPassword}`);
  console.log(`🔐 Admin password hash: ${adminPasswordHash}`);
  console.log('💡 Update ADMIN_PASSWORD_HASH in your .env file with the above hash');

  // Sample products from the Excel data
  const products = [
    {
      title: "TIBROS TB Mug - Studio Series - small 4 pcs set",
      price: 128.83,
      stock: 50,
      sku: "TB-MUG-SS-4",
      hsn: "6911",
      taxRate: 18,
      category: "Mugs",
      description: "Premium studio series mug set - 4 pieces"
    },
    {
      title: "TIBROS TB Mug - Studio Series - small 6pcs set",
      price: 156.00,
      stock: 30,
      sku: "TB-MUG-SS-6",
      hsn: "6911",
      taxRate: 12,
      category: "Mugs",
      description: "Premium studio series mug set - 6 pieces"
    },
    {
      title: "700ML PUSH CHOPPER heavy",
      price: 110.58,
      stock: 25,
      sku: "CHOPPER-700",
      hsn: "3924",
      taxRate: 18,
      category: "Kitchen Tools",
      description: "Heavy duty 700ml push chopper"
    },
    {
      title: "MAXFRESH | Hot Pot Solitaire 4000",
      price: 605.00,
      stock: 15,
      sku: "SHP4000",
      hsn: "73239390",
      taxRate: 12,
      category: "Cookware",
      description: "Premium hot pot with advanced features"
    },
    {
      title: "SS JALIROUND JUICER (01)",
      price: 186.24,
      stock: 20,
      sku: "JUICER-SS-01",
      hsn: "3924",
      taxRate: 18,
      category: "Kitchen Tools",
      description: "Stainless steel round juicer"
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
    console.log(`✅ Added product: ${product.title}`);
  }

  // Create sample permanent customer
  await prisma.customer.upsert({
    where: { phone: "+919876543210" },
    update: {},
    create: {
      name: "Regular Customer",
      phone: "+919876543210",
      type: "PERMANENT",
      notes: "Sample regular customer"
    }
  });

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
