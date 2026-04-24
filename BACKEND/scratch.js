const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const isMatch = await bcrypt.compare('000000', user.password);
  console.log("Password matches 000000:", isMatch);
}

main().finally(() => prisma.$disconnect());
