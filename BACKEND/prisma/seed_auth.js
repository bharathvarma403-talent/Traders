const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('123456', 12);
  const userPassword = await bcrypt.hash('123456', 12);

  // Admin account used by the local login page.
  await prisma.user.upsert({
    where: { email: 'Vasavi@admin.com' },
    update: {
      name: 'Vasavi Admin',
      password: adminPassword,
      phone: '+919912517623',
      role: 'ADMIN',
    },
    create: {
      name: 'Vasavi Admin',
      email: 'Vasavi@admin.com',
      password: adminPassword,
      phone: '+919912517623',
      role: 'ADMIN',
    },
  });

  // Demo customer account for local testing.
  await prisma.user.upsert({
    where: { email: 'user@vasavitraders.com' },
    update: {
      name: 'Test User',
      password: userPassword,
      phone: '8888888888',
      role: 'USER',
    },
    create: {
      name: 'Test User',
      email: 'user@vasavitraders.com',
      password: userPassword,
      phone: '8888888888',
      role: 'USER',
    },
  });

  console.log('Seeded local auth users successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
