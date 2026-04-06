const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database tables...');
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
  console.log('Seeding top-tier brands and realistic products...');
  const createBrand = async (name) => {
    return await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  };

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
    // --- ELECTRICAL (Real wiring & switches) ---
    { name: 'FR PVC Insulated Wire 1.5 sqmm', category: 'Electrical', subcategory: 'Wires & Cables', description: 'Flame retardant copper wire for residential wiring. 90m coil.', price: 1050, unit: 'coil', brandId: havells.id, rating: 5, stockCount: 120, imageUrl: 'https://images.unsplash.com/photo-1558442074-3c19857bc1dc?auto=format&fit=crop&w=1000&q=80' },
    { name: 'FR PVC Insulated Wire 2.5 sqmm', category: 'Electrical', subcategory: 'Wires & Cables', description: 'Heavy duty FR copper wire for AC/Geyser points. 90m coil.', price: 1650, unit: 'coil', brandId: finolex.id, rating: 5, stockCount: 80, imageUrl: 'https://images.unsplash.com/photo-150645606-d2495b5c9006?auto=format&fit=crop&w=1000&q=80' },
    { name: 'Penta 6A 1-Way Switch', category: 'Electrical', subcategory: 'Switches', description: 'Standard polycarbonate 6 Amp switch. White finish.', price: 45, unit: 'piece', brandId: anchor.id, rating: 4, stockCount: 500, imageUrl: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=1000&q=80' },
    { name: 'MCB 32A Double Pole', category: 'Electrical', subcategory: 'Circuit Breakers', description: 'Double pole miniature circuit breaker for main line protection.', price: 450, unit: 'piece', brandId: havells.id, rating: 5, stockCount: 50, imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1000&q=80' },
    { name: 'High Speed Ceiling Fan 1200mm', category: 'Electrical', subcategory: 'Fans', description: 'Energy efficient ceiling fan with anti-dust coating.', price: 2150, unit: 'piece', brandId: crompton.id, rating: 4, stockCount: 25, imageUrl: 'https://images.unsplash.com/photo-1618037341584-c5a7559e0004?auto=format&fit=crop&w=1000&q=80' },

    // --- PLUMBING (Pipes & Fittings) ---
    { name: 'CPVC SDR 11 Pipe 1-Inch', category: 'Plumbing', subcategory: 'Pipes', description: 'High-grade CPVC pipe for hot/cold water. Selling per 10ft length.', price: 420, unit: 'length', brandId: ashirvad.id, rating: 5, stockCount: 200, imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80' },
    { name: 'UPVC Schedule 40 Pipe 2-Inch', category: 'Plumbing', subcategory: 'Pipes', description: 'UPVC drainage and agricultural pipe. 20ft length.', price: 850, unit: 'length', brandId: finolex.id, rating: 4, stockCount: 150, imageUrl: 'https://images.unsplash.com/photo-1502422201995-23cbae0d2d31?auto=format&fit=crop&w=1000&q=80' },
    { name: 'Brass Ball Valve 1-Inch', category: 'Plumbing', subcategory: 'Valves', description: 'Heavy duty solid brass ball valve.', price: 650, unit: 'piece', brandId: ashirvad.id, rating: 5, stockCount: 80, imageUrl: 'https://images.unsplash.com/photo-1592383823674-ba5e80dc6810?auto=format&fit=crop&w=1000&q=80' },
    { name: 'Triple Layer Water Tank 1000L', category: 'Plumbing', subcategory: 'Tanks', description: 'UV protected triple layer plastic reservoir.', price: 6500, unit: 'piece', brandId: nandi.id, rating: 5, stockCount: 15, imageUrl: 'https://images.unsplash.com/photo-1563330232-57114bb0839c?auto=format&fit=crop&w=1000&q=80' },

    // --- CEMENT (Bags) ---
    { name: 'OPC 53 Grade Cement', category: 'Cement', subcategory: 'OPC', description: 'Ordinary Portland Cement for heavy concrete structures. 50kg bag.', price: 430, unit: 'bag', brandId: ultratech.id, rating: 5, stockCount: 300, imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356f2f?auto=format&fit=crop&w=1000&q=80' },
    { name: 'PPC Blended Cement', category: 'Cement', subcategory: 'PPC', description: 'Portland Pozzolana Cement for plastering and brickwork. 50kg bag.', price: 390, unit: 'bag', brandId: ambuja.id, rating: 4, stockCount: 400, imageUrl: 'https://images.unsplash.com/photo-1623058866380-4d4ec31b1473?auto=format&fit=crop&w=1000&q=80' },

    // --- PAINT (Buckets & Brushes) ---
    { name: 'Royal Emulsion Interior Paint', category: 'Paint', subcategory: 'Interior Emulsion', description: 'Premium luxury emulsion for interior walls. 20L Bucket.', price: 4800, unit: 'bucket', brandId: asianPaints.id, rating: 5, stockCount: 40, imageUrl: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?auto=format&fit=crop&w=1000&q=80' },
    { name: 'WeatherCoat Exterior Paint', category: 'Paint', subcategory: 'Exterior Emulsion', description: 'All weather protection exterior paint. 20L Bucket.', price: 4200, unit: 'bucket', brandId: berger.id, rating: 4, stockCount: 50, imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1000&q=80' },
    { name: 'Acrylic Wall Putty', category: 'Paint', subcategory: 'Putty', description: 'Smooth wall putty. 40kg bag.', price: 850, unit: 'bag', brandId: asianPaints.id, rating: 4, stockCount: 100, imageUrl: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=1000&q=80' },
    { name: 'Professional Paint Roller 9-Inch', category: 'Paint', subcategory: 'Accessories', description: 'Microfiber professional wall roller.', price: 250, unit: 'piece', brandId: generic.id, rating: 4, stockCount: 80, imageUrl: 'https://images.unsplash.com/photo-1596700813352-7efc9043ecb1?auto=format&fit=crop&w=1000&q=80' },

    // --- STEEL (Rebars) ---
    { name: 'TMT Rebar 8mm / Fe550D', category: 'Steel', subcategory: 'TMT Bars', description: 'Thermo Mechanically Treated bar for RC construction. Sold per piece (12m).', price: 280, unit: 'length', brandId: tata.id, rating: 5, stockCount: 1500, imageUrl: 'https://images.unsplash.com/photo-1533619223708-410a6ec93be8?auto=format&fit=crop&w=1000&q=80' },
    { name: 'TMT Rebar 12mm / Fe550D', category: 'Steel', subcategory: 'TMT Bars', description: 'Thermo Mechanically Treated heavy beam bar. Sold per piece (12m).', price: 620, unit: 'length', brandId: jsw.id, rating: 5, stockCount: 1000, imageUrl: 'https://images.unsplash.com/photo-1601582589907-f92af5ed9db8?auto=format&fit=crop&w=1000&q=80' },
    { name: 'Binding Wire (GI)', category: 'Steel', subcategory: 'Hardware', description: 'Galvanized iron binding wire. Sold per Kg.', price: 85, unit: 'kg', brandId: generic.id, rating: 4, stockCount: 500, imageUrl: 'https://images.unsplash.com/photo-1558223393-27150a00e57d?auto=format&fit=crop&w=1000&q=80' },

    // --- SAND ---
    { name: 'Filtered River Sand', category: 'Sand', subcategory: 'River Sand', description: 'Fine-grade river sand for high quality plastering. Sold per Tractor Load (approx 3 tons).', price: 3500, unit: 'load', brandId: generic.id, rating: 4, stockCount: 20, imageUrl: 'https://images.unsplash.com/photo-1582260408544-24584e0307bb?auto=format&fit=crop&w=1000&q=80' },
    { name: 'Manufactured M-Sand', category: 'Sand', subcategory: 'M-Sand', description: 'Crushed rock sand for structural concrete. Sold per Tractor Load.', price: 2800, unit: 'load', brandId: generic.id, rating: 5, stockCount: 40, imageUrl: 'https://images.unsplash.com/photo-1542158872-dd3b8ce8f415?auto=format&fit=crop&w=1000&q=80' },

    // --- BRICKS ---
    { name: 'Premium Red Clay Bricks', category: 'Bricks', subcategory: 'Clay', description: 'Kiln baked standard red bricks. Sold per 1000 pieces.', price: 7500, unit: '1000 pieces', brandId: generic.id, rating: 4, stockCount: 15, imageUrl: 'https://images.unsplash.com/photo-1587211130678-0e3632cf4308?auto=format&fit=crop&w=1000&q=80' },
    { name: 'Solid Concrete Blocks 6-Inch', category: 'Bricks', subcategory: 'Concrete', description: 'Standard 6-inch solid blocks for compound walls. Sold per piece.', price: 42, unit: 'piece', brandId: generic.id, rating: 5, stockCount: 5000, imageUrl: 'https://images.unsplash.com/photo-1601628828688-632f38a5a7d0?auto=format&fit=crop&w=1000&q=80' },

    // --- TOOLS ---
    { name: 'Professional Impact Drill 600W', category: 'Tools', subcategory: 'Power Tools', description: 'Heavy duty rotary impact drill for masonry and wood.', price: 3200, unit: 'piece', brandId: bosch.id, rating: 5, stockCount: 12, imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80' },
    { name: 'Claw Hammer steel shaft', category: 'Tools', subcategory: 'Hand Tools', description: 'Drop forged steel claw hammer with rubber grip.', price: 450, unit: 'piece', brandId: stanley.id, rating: 4, stockCount: 30, imageUrl: 'https://images.unsplash.com/photo-1536214227926-d6b797ebd925?auto=format&fit=crop&w=1000&q=80' },
    { name: 'Measuring Tape 5m/16ft', category: 'Tools', subcategory: 'Measuring', description: 'Industrial grade measuring retractable tape.', price: 220, unit: 'piece', brandId: stanley.id, rating: 4, stockCount: 50, imageUrl: 'https://images.unsplash.com/photo-1521191024546-b39174afdbac?auto=format&fit=crop&w=1000&q=80' },

    // --- HARDWARE ---
    { name: 'Self Tapping Steel Screws (Box of 100)', category: 'Hardware', subcategory: 'Fasteners', description: 'Zinc plated Philip head screws. Box of 100.', price: 150, unit: 'box', brandId: generic.id, rating: 4, stockCount: 200, imageUrl: 'https://images.unsplash.com/photo-1597500589139-43c2cbb6db58?auto=format&fit=crop&w=1000&q=80' },
    { name: 'Heavy Duty Door Hinge 4-Inch', category: 'Hardware', subcategory: 'Fittings', description: 'Stainless steel door hinges, set of 2.', price: 280, unit: 'set', brandId: generic.id, rating: 4, stockCount: 150, imageUrl: 'https://images.unsplash.com/photo-1582236836798-e7d690a78631?auto=format&fit=crop&w=1000&q=80' },
    { name: 'Iron Nails 2-Inch (1kg)', category: 'Hardware', subcategory: 'Fasteners', description: 'Standard woodwork nails. Sold per Kg.', price: 90, unit: 'kg', brandId: generic.id, rating: 4, stockCount: 300, imageUrl: 'https://images.unsplash.com/photo-1620286708518-d7ecea55e2c5?auto=format&fit=crop&w=1000&q=80' },
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

  console.log('Successfully seeded 28 realistic products across ' + [...new Set(products.map(p => p.category))].length + ' categories.');
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
