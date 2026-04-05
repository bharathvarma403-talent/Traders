const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.productRating.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.aiQuery.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();

  // ── Seed Admin Account ─────────────────────────────────────────────────
  console.log('Seeding admin account...');
  const adminPassword = await bcrypt.hash('123456', 12);
  await prisma.user.upsert({
    where: { email: 'Vasavi@admin.com' },
    update: { password: adminPassword, role: 'ADMIN', name: 'Vasavi Admin' },
    create: {
      name: 'Vasavi Admin',
      email: 'Vasavi@admin.com',
      password: adminPassword,
      phone: '+919912517623',
      role: 'ADMIN',
    },
  });
  console.log('Admin seeded: Vasavi@admin.com / 123456');

  // ── Create Brands ──────────────────────────────────────────────────────
  console.log('Seeding brands and products...');
  const createBrand = async (name) => {
    return await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  };

  const anchor = await createBrand('Anchor');
  const havells = await createBrand('Havells');
  const crompton = await createBrand('Crompton');
  const ashirvad = await createBrand('Ashirvad');
  const finolex = await createBrand('Finolex');
  const supreme = await createBrand('Supreme');
  const sudhakar = await createBrand('Sudhakar');
  const narmada = await createBrand('Narmada');
  const nandiGold = await createBrand('Nandi Gold');
  const nandi = await createBrand('Nandi');
  const kcp = await createBrand('KCP Cement');
  const ultratech = await createBrand('UltraTech');
  const birlaWhite = await createBrand('Birla White');
  const walker = await createBrand('Walker Cement');
  const acc = await createBrand('ACC');
  const apex = await createBrand('Apex');
  const asianPaints = await createBrand('Asian Paints');
  const unbranded = await createBrand('Generic');

  const products = [
    // --- ELECTRICAL MATERIALS ---
    { name: '1/18 Wire (~1-1.5 sqmm)', category: 'Electrical', description: 'Wires (per meter approx.)', priceMin: 10, priceMax: 20, brandId: havells.id, rating: 4, stockCount: 500, imageUrl: '/products/wire.png' },
    { name: 'Wire 2.0 sqmm', category: 'Electrical', description: 'Wires (per meter approx.)', priceMin: 18, priceMax: 30, brandId: havells.id, rating: 4, stockCount: 400, imageUrl: '/products/wire.png' },
    { name: 'Wire 2.5 sqmm', category: 'Electrical', description: 'Wires (per meter approx.)', priceMin: 25, priceMax: 40, brandId: havells.id, rating: 4, stockCount: 350, imageUrl: '/products/wire.png' },
    { name: 'Wire 4.0 sqmm', category: 'Electrical', description: 'Wires (per meter approx.)', priceMin: 45, priceMax: 60, brandId: havells.id, rating: 5, stockCount: 300, imageUrl: '/products/wire.png' },
    { name: 'Wire 6.0 sqmm', category: 'Electrical', description: 'Wires (per meter approx.)', priceMin: 70, priceMax: 110, brandId: havells.id, rating: 5, stockCount: 200, imageUrl: '/products/wire.png' },
    { name: '6A Switch', category: 'Electrical', description: 'Standard switch', priceMin: 40, priceMax: 120, brandId: anchor.id, rating: 4, stockCount: 150, imageUrl: '/products/switch.png' },
    { name: '6A Socket', category: 'Electrical', description: 'Standard socket', priceMin: 50, priceMax: 150, brandId: anchor.id, rating: 4, stockCount: 150, imageUrl: '/products/switch.png' },
    { name: '16A Switch', category: 'Electrical', description: 'Heavy duty switch', priceMin: 120, priceMax: 300, brandId: anchor.id, rating: 5, stockCount: 80, imageUrl: '/products/switch.png' },
    { name: '16A Socket', category: 'Electrical', description: 'Heavy duty socket', priceMin: 150, priceMax: 400, brandId: anchor.id, rating: 5, stockCount: 80, imageUrl: '/products/switch.png' },
    { name: 'DP Switch', category: 'Electrical', description: 'Double pole switch', priceMin: 250, priceMax: 800, brandId: havells.id, rating: 5, stockCount: 40, imageUrl: '/products/switch.png' },
    { name: 'Fan Regulator', category: 'Electrical', description: 'Regulator for fan speed', priceMin: 150, priceMax: 600, brandId: anchor.id, rating: 4, stockCount: 60, imageUrl: '/products/switch.png' },
    { name: 'MCB', category: 'Electrical', description: 'Miniature Circuit Breaker', priceMin: 150, priceMax: 800, brandId: havells.id, rating: 5, stockCount: 100, imageUrl: '/products/switch.png' },
    { name: '40 Pin Socket', category: 'Electrical', description: 'Multi-pin socket configuration', priceMin: 100, priceMax: 300, brandId: unbranded.id, rating: 4, stockCount: 50, imageUrl: '/products/switch.png' },
    { name: 'Ceiling Fan', category: 'Electrical', description: 'Energy efficient ceiling fan', priceMin: 1800, priceMax: 4500, brandId: crompton.id, rating: 5, stockCount: 25 },
    { name: 'Table Fan', category: 'Electrical', description: 'Portable table fan', priceMin: 1200, priceMax: 3000, brandId: crompton.id, rating: 4, stockCount: 30 },

    // --- PIPES & FITTINGS ---
    { name: '3/4 inch CPVC Pipe', category: 'Pipes', description: 'CPVC pipe (per ft approx.)', priceMin: 25, priceMax: 40, brandId: ashirvad.id, rating: 4, stockCount: 200, imageUrl: '/products/pipe.png' },
    { name: '1 inch CPVC Pipe', category: 'Pipes', description: 'CPVC pipe (per ft approx.)', priceMin: 35, priceMax: 60, brandId: ashirvad.id, rating: 5, stockCount: 180, imageUrl: '/products/pipe.png' },
    { name: 'L Bend Fitting', category: 'Pipes', description: 'Standard L Bend', priceMin: 10, priceMax: 40, brandId: unbranded.id, rating: 4, stockCount: 300, imageUrl: '/products/pipe.png' },
    { name: 'T Bend Fitting', category: 'Pipes', description: 'Standard T Bend', priceMin: 15, priceMax: 60, brandId: unbranded.id, rating: 4, stockCount: 300, imageUrl: '/products/pipe.png' },
    { name: '2 inch PVC Pipe', category: 'Pipes', description: 'Price per 10 ft pipe', priceMin: 200, priceMax: 350, brandId: sudhakar.id, rating: 4, stockCount: 100, imageUrl: '/products/pipe.png' },
    { name: '2.5 inch PVC Pipe', category: 'Pipes', description: 'Price per 10 ft pipe', priceMin: 350, priceMax: 600, brandId: narmada.id, rating: 4, stockCount: 80, imageUrl: '/products/pipe.png' },
    { name: '3 inch PVC Pipe', category: 'Pipes', description: 'Price per 10 ft pipe', priceMin: 600, priceMax: 1000, brandId: nandiGold.id, rating: 5, stockCount: 60, imageUrl: '/products/pipe.png' },
    { name: '4 inch PVC Pipe', category: 'Pipes', description: 'Price per 10 ft pipe', priceMin: 900, priceMax: 1500, brandId: nandiGold.id, rating: 5, stockCount: 50, imageUrl: '/products/pipe.png' },

    // --- WATER TANKS ---
    { name: '500 L Tank', category: 'Tanks', description: 'Storage tank', priceMin: 3000, priceMax: 5000, brandId: nandi.id, rating: 4, stockCount: 15, imageUrl: '/products/tank.png' },
    { name: '750 L Tank', category: 'Tanks', description: 'Triple layer storage tank', priceMin: 5000, priceMax: 7500, brandId: nandi.id, rating: 4, stockCount: 10, imageUrl: '/products/tank.png' },
    { name: '1000 L Tank', category: 'Tanks', description: 'Triple layer UV protection tank', priceMin: 6500, priceMax: 10000, brandId: nandi.id, rating: 5, stockCount: 8, imageUrl: '/products/tank.png' },

    // --- CEMENT ---
    { name: 'KCP Cement', category: 'Cement', description: 'Price per 50kg bag', priceMin: 350, priceMax: 420, brandId: kcp.id, rating: 4, stockCount: 200, imageUrl: '/products/cement.png' },
    { name: 'UltraTech OPC', category: 'Cement', description: 'Price per 50kg bag (Stronger)', priceMin: 380, priceMax: 450, brandId: ultratech.id, rating: 5, stockCount: 150, imageUrl: '/products/cement.png' },
    { name: 'UltraTech PPC', category: 'Cement', description: 'Price per 50kg bag (Plastering)', priceMin: 350, priceMax: 420, brandId: ultratech.id, rating: 4, stockCount: 150, imageUrl: '/products/cement.png' },
    { name: 'Birla White', category: 'Cement', description: 'Price per 50kg bag', priceMin: 900, priceMax: 1200, brandId: birlaWhite.id, rating: 5, stockCount: 50, imageUrl: '/products/cement.png' },
    { name: 'Walker Cement', category: 'Cement', description: 'Price per 50kg bag', priceMin: 320, priceMax: 400, brandId: walker.id, rating: 3, stockCount: 100, imageUrl: '/products/cement.png' },

    // --- PAINT & PRIMERS ---
    { name: 'ACC Primer', category: 'Paint', description: 'Price per Liter', priceMin: 150, priceMax: 250, brandId: acc.id, rating: 4, stockCount: 80, imageUrl: '/products/paint.png' },
    { name: 'Apex Primer', category: 'Paint', description: 'Price per Liter', priceMin: 180, priceMax: 300, brandId: apex.id, rating: 4, stockCount: 70, imageUrl: '/products/paint.png' },
    { name: 'Asian Paints (Emulsion)', category: 'Paint', description: 'Price per Liter', priceMin: 250, priceMax: 600, brandId: asianPaints.id, rating: 5, stockCount: 100, imageUrl: '/products/paint.png' },
    { name: 'Cooling Paints', category: 'Paint', description: 'Price per Liter', priceMin: 300, priceMax: 700, brandId: unbranded.id, rating: 4, stockCount: 40, imageUrl: '/products/paint.png' },
    { name: 'Paint Brushes', category: 'Paint', description: 'Accessories', priceMin: 20, priceMax: 200, brandId: unbranded.id, rating: 4, stockCount: 200, imageUrl: '/products/paint.png' },
  ];

  for (const p of products) {
    const createdProduct = await prisma.product.create({
      data: {
        name: p.name,
        category: p.category,
        description: p.description,
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        brandId: p.brandId,
        stockCount: p.stockCount,
        imageUrl: p.imageUrl,
      },
    });

    await prisma.productRating.create({
      data: {
        rating: p.rating,
        productId: createdProduct.id,
      },
    });
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
