const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = new PrismaClient();

function resolveSeedPassword(envName, label) {
  const configured = process.env[envName];
  // Ensure we generate a 6-digit numeric PIN for the frontend compatibility
  if (typeof configured === 'string' && configured.trim().match(/^\d{6}$/)) {
    return { password: configured.trim(), source: 'env' };
  }

  const generated = Math.floor(100000 + Math.random() * 900000).toString();
  console.warn(`[seed] ${envName} is not set or not a 6-digit PIN. Generated a 6-digit PIN for ${label}.`);
  return { password: generated, source: 'generated' };
}

async function main() {
  console.log('Clearing existing database tables...');
  await prisma.productRating.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.aiQuery.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();

  // ── Seed Admin Account ─────────────────────────────────────────────────
  console.log('Seeding admin account...');
  const adminEmail = String(process.env.SEED_ADMIN_EMAIL || 'vasavi@admin.com').trim().toLowerCase();
  const adminName = String(process.env.SEED_ADMIN_NAME || 'Vasavi Admin').trim() || 'Vasavi Admin';
  const adminPhone = String(process.env.SEED_ADMIN_PHONE || '+919912517623').trim() || '+919912517623';
  const { password: adminPasswordPlain, source: adminPasswordSource } = resolveSeedPassword('SEED_ADMIN_PASSWORD', 'admin');
  const adminPassword = await bcrypt.hash(adminPasswordPlain, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: adminPassword, role: 'ADMIN', name: adminName, phone: adminPhone },
    create: {
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      phone: adminPhone,
      role: 'ADMIN',
    },
  });
  console.log(`Admin seeded: ${adminEmail} (${adminPasswordSource === 'env' ? 'PIN provided via env' : 'temporary 6-digit PIN generated'})`);
  if (adminPasswordSource === 'generated') {
    console.log(`ATTENTION: Temporary admin PIN is: ${adminPasswordPlain}`);
  }

  // ── Create Brands ──────────────────────────────────────────────────────
  console.log('Seeding top-tier brands and realistic products...');
  const createBrand = (name) => prisma.brand.upsert({ where: { name }, update: {}, create: { name } });

  const anchor = await createBrand('Anchor by Panasonic');
  const havells = await createBrand('Havells India');
  const crompton = await createBrand('Crompton');
  const ashirvad = await createBrand('Ashirvad Pipes');
  const finolex = await createBrand('Finolex');
  const nandi = await createBrand('Nandi Tanks');
  const ultratech = await createBrand('UltraTech Cement');
  const ambuja = await createBrand('Ambuja Cements');
  const asianPaints = await createBrand('Asian Paints');
  const berger = await createBrand('Berger Paints');
  const tata = await createBrand('Tata Tiscon');
  const jsw = await createBrand('JSW NeoSteel');
  const bosch = await createBrand('Bosch');
  const stanley = await createBrand('Stanley');
  const generic = await createBrand('Vasavi Supply');

  const products = [
    // --- ELECTRICAL ---
    { name: 'FR PVC Insulated Wire 1.5 sqmm', category: 'Electrical', subcategory: 'Wires & Cables', description: 'Flame retardant copper wire for residential wiring. 90m coil.', price: 1050, unit: 'coil', brandId: havells.id, rating: 5, stockCount: 120, imageUrl: 'https://images.unsplash.com/photo-1558442074-3c19857bc1dc' },
    { name: 'FR PVC Insulated Wire 2.5 sqmm', category: 'Electrical', subcategory: 'Wires & Cables', description: 'Heavy duty FR copper wire for AC/Geyser points. 90m coil.', price: 1650, unit: 'coil', brandId: finolex.id, rating: 5, stockCount: 80, imageUrl: 'https://images.unsplash.com/photo-1558442074-3c19857bc1dc' },
    { name: 'Penta 6A 1-Way Switch', category: 'Electrical', subcategory: 'Switches', description: 'Standard polycarbonate 6 Amp switch. White finish.', price: 45, unit: 'piece', brandId: anchor.id, rating: 4, stockCount: 500, imageUrl: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2' },
    { name: 'MCB 32A Double Pole', category: 'Electrical', subcategory: 'Circuit Breakers', description: 'Double pole miniature circuit breaker for main line protection.', price: 450, unit: 'piece', brandId: havells.id, rating: 5, stockCount: 50, imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4' },
    { name: 'High Speed Ceiling Fan 1200mm', category: 'Electrical', subcategory: 'Fans', description: 'Energy efficient ceiling fan with anti-dust coating.', price: 2150, unit: 'piece', brandId: crompton.id, rating: 4, stockCount: 25, imageUrl: 'https://images.unsplash.com/photo-1618037341584-c5a7559e0000' },

    // --- PLUMBING ---
    { name: 'CPVC SDR 11 Pipe 1-Inch', category: 'Plumbing', subcategory: 'Pipes', description: 'High-grade CPVC pipe for hot/cold water. Selling per 10ft length.', price: 420, unit: 'length', brandId: ashirvad.id, rating: 5, stockCount: 200, imageUrl: 'https://images.unsplash.com/photo-B0jijv2X-U8' },
    { name: 'UPVC Schedule 40 Pipe 2-Inch', category: 'Plumbing', subcategory: 'Pipes', description: 'UPVC drainage and agricultural pipe. 20ft length.', price: 850, unit: 'length', brandId: finolex.id, rating: 4, stockCount: 150, imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a' },
    { name: 'Brass Ball Valve 1-Inch', category: 'Plumbing', subcategory: 'Valves', description: 'Heavy duty solid brass ball valve.', price: 650, unit: 'piece', brandId: ashirvad.id, rating: 5, stockCount: 80, imageUrl: 'https://images.unsplash.com/photo-1592383823674-ba5e80dc6810' },
    { name: 'Triple Layer Water Tank 1000L', category: 'Plumbing', subcategory: 'Tanks', description: 'UV protected triple layer plastic reservoir.', price: 6500, unit: 'piece', brandId: nandi.id, rating: 5, stockCount: 15, imageUrl: 'https://images.unsplash.com/photo-1563330232-57114bb0839c' },

    // --- CEMENT ---
    { name: 'OPC 53 Grade Cement', category: 'Cement', subcategory: 'OPC', description: 'Ordinary Portland Cement for heavy concrete structures. 50kg bag.', price: 430, unit: 'bag', brandId: ultratech.id, rating: 5, stockCount: 300, imageUrl: 'https://images.unsplash.com/photo-3H26DnkYLHo' },
    { name: 'PPC Blended Cement', category: 'Cement', subcategory: 'PPC', description: 'Portland Pozzolana Cement for plastering and brickwork. 50kg bag.', price: 390, unit: 'bag', brandId: ambuja.id, rating: 4, stockCount: 400, imageUrl: 'https://images.unsplash.com/photo-3H26DnkYLHo' },

    // --- PAINT ---
    { name: 'Royal Emulsion Interior Paint', category: 'Paint', subcategory: 'Interior Emulsion', description: 'Premium luxury emulsion for interior walls. 20L Bucket.', price: 4800, unit: 'bucket', brandId: asianPaints.id, rating: 5, stockCount: 40, imageUrl: 'https://images.unsplash.com/photo-NFamNeP3OjA' },
    { name: 'WeatherCoat Exterior Paint', category: 'Paint', subcategory: 'Exterior Emulsion', description: 'All weather protection exterior paint. 20L Bucket.', price: 4200, unit: 'bucket', brandId: berger.id, rating: 4, stockCount: 50, imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f' },
    { name: 'Acrylic Wall Putty', category: 'Paint', subcategory: 'Putty', description: 'Smooth wall putty. 40kg bag.', price: 850, unit: 'bag', brandId: asianPaints.id, rating: 4, stockCount: 100, imageUrl: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b' },
    { name: 'Professional Paint Roller 9-Inch', category: 'Paint', subcategory: 'Accessories', description: 'Microfiber professional wall roller.', price: 250, unit: 'piece', brandId: generic.id, rating: 4, stockCount: 80, imageUrl: 'https://images.unsplash.com/photo-1596700813352-7efc9043ecb1' },

    // --- STEEL ---
    { name: 'TMT Rebar 8mm / Fe550D', category: 'Steel', subcategory: 'TMT Bars', description: 'Thermo Mechanically Treated bar for RC construction. Sold per piece (12m).', price: 280, unit: 'length', brandId: tata.id, rating: 5, stockCount: 1500, imageUrl: 'https://images.unsplash.com/photo-ARW8QOYR_bI' },
    { name: 'TMT Rebar 12mm / Fe550D', category: 'Steel', subcategory: 'TMT Bars', description: 'Thermo Mechanically Treated heavy beam bar. Sold per piece (12m).', price: 620, unit: 'length', brandId: jsw.id, rating: 5, stockCount: 1000, imageUrl: 'https://images.unsplash.com/photo-ARW8QOYR_bI' },
    { name: 'Binding Wire (GI)', category: 'Steel', subcategory: 'Hardware', description: 'Galvanized iron binding wire. Sold per Kg.', price: 85, unit: 'kg', brandId: generic.id, rating: 4, stockCount: 500, imageUrl: 'https://images.unsplash.com/photo-1558223393-27150a00e57d' },

    // --- SAND ---
    { name: 'Filtered River Sand', category: 'Sand', subcategory: 'River Sand', description: 'Fine-grade river sand for high quality plastering. Sold per Tractor Load (approx 3 tons).', price: 3500, unit: 'load', brandId: generic.id, rating: 4, stockCount: 20, imageUrl: 'https://images.unsplash.com/photo-Mv9hjnEUHR4' },
    { name: 'Manufactured M-Sand', category: 'Sand', subcategory: 'M-Sand', description: 'Crushed rock sand for structural concrete. Sold per Tractor Load.', price: 2800, unit: 'load', brandId: generic.id, rating: 5, stockCount: 40, imageUrl: 'https://images.unsplash.com/photo-Mv9hjnEUHR4' },

    // --- BRICKS ---
    { name: 'Premium Red Clay Bricks', category: 'Bricks', subcategory: 'Clay', description: 'Kiln baked standard red bricks. Sold per 1000 pieces.', price: 7500, unit: '1000 pieces', brandId: generic.id, rating: 4, stockCount: 15, imageUrl: 'https://images.unsplash.com/photo-BTwLNLxPjzk' },
    { name: 'Solid Concrete Blocks 6-Inch', category: 'Bricks', subcategory: 'Concrete', description: 'Standard 6-inch solid blocks for compound walls. Sold per piece.', price: 42, unit: 'piece', brandId: generic.id, rating: 5, stockCount: 5000, imageUrl: 'https://images.unsplash.com/photo-1601628828688-632f38a5a7d0' },

    // --- TOOLS ---
    { name: 'Professional Impact Drill 600W', category: 'Tools', subcategory: 'Power Tools', description: 'Heavy duty rotary impact drill for masonry and wood.', price: 3200, unit: 'piece', brandId: bosch.id, rating: 5, stockCount: 12, imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c' },
    { name: 'Claw Hammer steel shaft', category: 'Tools', subcategory: 'Hand Tools', description: 'Drop forged steel claw hammer with rubber grip.', price: 450, unit: 'piece', brandId: stanley.id, rating: 4, stockCount: 30, imageUrl: 'https://images.unsplash.com/photo-1626071490278-f2b7a0d4c6d6' },
    { name: 'Measuring Tape 5m/16ft', category: 'Tools', subcategory: 'Measuring', description: 'Industrial grade measuring retractable tape.', price: 220, unit: 'piece', brandId: stanley.id, rating: 4, stockCount: 50, imageUrl: 'https://images.unsplash.com/photo-1521191024546-b39174afdbac' },

    // --- HARDWARE ---
    { name: 'Self Tapping Steel Screws (Box of 100)', category: 'Hardware', subcategory: 'Fasteners', description: 'Zinc plated Philip head screws. Box of 100.', price: 150, unit: 'box', brandId: generic.id, rating: 4, stockCount: 200, imageUrl: 'https://images.unsplash.com/photo-1597500589139-43c2cbb6db58' },
    { name: 'Heavy Duty Door Hinge 4-Inch', category: 'Hardware', subcategory: 'Fittings', description: 'Stainless steel door hinges, set of 2.', price: 280, unit: 'set', brandId: generic.id, rating: 4, stockCount: 150, imageUrl: 'https://images.unsplash.com/photo-1582236836798-e7d690a78631' },
    { name: 'Iron Nails 2-Inch (1kg)', category: 'Hardware', subcategory: 'Fasteners', description: 'Standard woodwork nails. Sold per Kg.', price: 90, unit: 'kg', brandId: generic.id, rating: 4, stockCount: 300, imageUrl: 'https://images.unsplash.com/photo-1620286708518-d7ecea55e2c5' },
  ];

  for (const p of products) {
    const createdProduct = await prisma.product.create({
      data: {
        name: p.name,
        category: p.category,
        subcategory: p.subcategory,
        description: p.description,
        price: p.price,
        unit: p.unit,
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

  console.log(`Successfully seeded ${products.length} realistic products across ${[...new Set(products.map(p => p.category))].length} categories.`);
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
