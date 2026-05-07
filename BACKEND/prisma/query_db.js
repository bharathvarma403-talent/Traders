const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  let brokenProducts = [];
  let workingProducts = 0;

  for (const product of products) {
    if (!product.imageUrl || product.imageUrl.trim() === '' || !product.imageUrl.startsWith('http')) {
      brokenProducts.push({
        id: product.id,
        name: product.name,
        category: product.category,
        imageUrl: product.imageUrl,
        brandId: product.brandId,
      });
    } else {
      workingProducts++;
    }
  }

  console.log('--- BROKEN PRODUCTS ---');
  console.log(JSON.stringify(brokenProducts, null, 2));
  console.log(`\nBroken Products Count: ${brokenProducts.length}`);
  console.log(`Working Products Count: ${workingProducts}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
