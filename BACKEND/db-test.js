const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function main() {
  console.log("Checking connection...");
  const users = await prisma.user.findMany({ take: 1 });
  console.log("Users:", users.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
