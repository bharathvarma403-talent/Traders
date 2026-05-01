require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Give everything a placeholder http URL if they don't have one so we don't violate NOT NULL or CHECK constraints during alter
    await prisma.$executeRawUnsafe(`UPDATE "Product" SET "imageUrl" = 'https://placeholder.com/image.png' WHERE "imageUrl" IS NULL OR "imageUrl" NOT LIKE 'http%';`);
    
    // 2. Add CHECK constraint
    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD CONSTRAINT "imageUrl_valid" CHECK ("imageUrl" LIKE 'http%');`);
    
    console.log('Successfully added constraint');
  } catch (error) {
    if (error.message.includes('already exists')) {
       console.log('Constraint already exists.');
    } else {
       console.error('Error adding constraint:', error);
    }
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
