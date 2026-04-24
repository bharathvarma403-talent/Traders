const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const productsToAdd = [
  // Electrical Materials - Wires
  { name: '1/18 Wire', category: 'Electrical', subcategory: 'Wires', description: 'Standard residential wiring cable', price: 800, unit: 'coil', brand: 'Vasavi Supply' },
  { name: '2.0 Wire', category: 'Electrical', subcategory: 'Wires', description: 'Heavy duty copper wire 2.0sqmm', price: 1200, unit: 'coil', brand: 'Finolex' },
  { name: '2.5 Wire', category: 'Electrical', subcategory: 'Wires', description: 'Power circuit wire 2.5sqmm', price: 1600, unit: 'coil', brand: 'Finolex' },
  { name: '4.0 Wire', category: 'Electrical', subcategory: 'Wires', description: 'AC/Mains wire 4.0sqmm', price: 2400, unit: 'coil', brand: 'Finolex' },
  { name: '6.0 Wire', category: 'Electrical', subcategory: 'Wires', description: 'Industrial/Main line wire 6.0sqmm', price: 3200, unit: 'coil', brand: 'Finolex' },
  
  // Switches & Sockets
  { name: '6 Amp Switch', category: 'Electrical', subcategory: 'Switches & Sockets', description: 'Standard light/fan switch', price: 45, unit: 'piece', brand: 'Anchor by Panasonic' },
  { name: '6 Amp Socket', category: 'Electrical', subcategory: 'Switches & Sockets', description: '3-pin standard socket', price: 65, unit: 'piece', brand: 'Anchor by Panasonic' },
  { name: '16 Amp Switch', category: 'Electrical', subcategory: 'Switches & Sockets', description: 'Heavy duty power switch', price: 120, unit: 'piece', brand: 'Anchor by Panasonic' },
  { name: '16 Amp Socket', category: 'Electrical', subcategory: 'Switches & Sockets', description: 'Heavy duty power socket', price: 150, unit: 'piece', brand: 'Anchor by Panasonic' },
  { name: 'DP Switch (Double Pole)', category: 'Electrical', subcategory: 'Switches & Sockets', description: 'Main power DP switch', price: 280, unit: 'piece', brand: 'Anchor by Panasonic' },
  
  // Other Electrical
  { name: 'Fan Regulator', category: 'Electrical', subcategory: 'Accessories', description: 'Modular fan speed controller', price: 180, unit: 'piece', brand: 'Anchor by Panasonic' },
  { name: 'MCB (Miniature Circuit Breaker)', category: 'Electrical', subcategory: 'Accessories', description: 'Standard safety circuit breaker', price: 250, unit: 'piece', brand: 'Havells India' },
  { name: '40 Pin Socket', category: 'Electrical', subcategory: 'Accessories', description: 'Industrial 40 pin connector/socket', price: 450, unit: 'piece', brand: 'Vasavi Supply' },
  
  // Fans (Crompton)
  { name: 'Ceiling Fan (Crompton)', category: 'Electrical', subcategory: 'Fans', description: 'Crompton high-speed ceiling fan', price: 2200, unit: 'piece', brand: 'Crompton' },
  { name: 'Table Fan (Crompton)', category: 'Electrical', subcategory: 'Fans', description: 'Crompton oscillating table fan', price: 1850, unit: 'piece', brand: 'Crompton' },
  
  // CPVC Pipes
  { name: '1 inch CPVC pipe', category: 'Plumbing', subcategory: 'CPVC Pipes', description: 'Hot and cold water CPVC pipe', price: 450, unit: 'length', brand: 'Ashirvad Pipes' },
  { name: '3/4 inch CPVC pipe', category: 'Plumbing', subcategory: 'CPVC Pipes', description: 'Standard CPVC water pipe', price: 320, unit: 'length', brand: 'Ashirvad Pipes' },
  
  // Pipe Fittings
  { name: 'L Bend', category: 'Plumbing', subcategory: 'Fittings', description: 'Standard pipe L-bend connector', price: 25, unit: 'piece', brand: 'Vasavi Supply' },
  { name: 'T Bend', category: 'Plumbing', subcategory: 'Fittings', description: 'Standard pipe T-junction connector', price: 35, unit: 'piece', brand: 'Vasavi Supply' },
  { name: '1½ inch T Bend', category: 'Plumbing', subcategory: 'Fittings', description: 'Heavy duty 1.5 inch T-bend', price: 85, unit: 'piece', brand: 'Vasavi Supply' },
  { name: '1½ inch L Bend', category: 'Plumbing', subcategory: 'Fittings', description: 'Heavy duty 1.5 inch L-bend', price: 65, unit: 'piece', brand: 'Vasavi Supply' },
  
  // Sudhakar Pipes
  { name: '4 inch pipe (Sudhakar)', category: 'Plumbing', subcategory: 'Sudhakar Pipes', description: 'High quality Sudhakar PVC pipe', price: 1200, unit: 'length', brand: 'Sudhakar' },
  { name: '3 inch pipe (Sudhakar)', category: 'Plumbing', subcategory: 'Sudhakar Pipes', description: 'Sudhakar PVC drainage pipe', price: 850, unit: 'length', brand: 'Sudhakar' },
  { name: '2½ inch pipe (Sudhakar)', category: 'Plumbing', subcategory: 'Sudhakar Pipes', description: 'Sudhakar PVC water pipe', price: 650, unit: 'length', brand: 'Sudhakar' },
  { name: '2 inch pipe (Sudhakar)', category: 'Plumbing', subcategory: 'Sudhakar Pipes', description: 'Sudhakar standard PVC pipe', price: 480, unit: 'length', brand: 'Sudhakar' },
  
  // Narmada Pipes
  { name: '4 inch pipe (Narmada)', category: 'Plumbing', subcategory: 'Narmada Pipes', description: 'Narmada brand PVC pipe', price: 1100, unit: 'length', brand: 'Narmada' },
  { name: '3 inch pipe (Narmada)', category: 'Plumbing', subcategory: 'Narmada Pipes', description: 'Narmada PVC drainage pipe', price: 780, unit: 'length', brand: 'Narmada' },
  { name: '2½ inch pipe (Narmada)', category: 'Plumbing', subcategory: 'Narmada Pipes', description: 'Narmada PVC water pipe', price: 590, unit: 'length', brand: 'Narmada' },
  { name: '2 inch pipe (Narmada)', category: 'Plumbing', subcategory: 'Narmada Pipes', description: 'Narmada standard PVC pipe', price: 420, unit: 'length', brand: 'Narmada' },
  
  // Nandi Gold Pipes
  { name: '4 inch pipe (Nandi Gold)', category: 'Plumbing', subcategory: 'Nandi Gold Pipes', description: 'Premium Nandi Gold PVC pipe', price: 1300, unit: 'length', brand: 'Nandi Gold' },
  { name: '3 inch pipe (Nandi Gold)', category: 'Plumbing', subcategory: 'Nandi Gold Pipes', description: 'Nandi Gold PVC drainage pipe', price: 920, unit: 'length', brand: 'Nandi Gold' },
  { name: '2½ inch pipe (Nandi Gold)', category: 'Plumbing', subcategory: 'Nandi Gold Pipes', description: 'Nandi Gold PVC water pipe', price: 720, unit: 'length', brand: 'Nandi Gold' },
  { name: '2 inch pipe (Nandi Gold)', category: 'Plumbing', subcategory: 'Nandi Gold Pipes', description: 'Nandi Gold standard PVC pipe', price: 540, unit: 'length', brand: 'Nandi Gold' },
  
  // Water Tanks (Nandi)
  { name: '1000 Litre Water Tank (Nandi)', category: 'Plumbing', subcategory: 'Tanks', description: 'Triple layer Nandi water tank', price: 6500, unit: 'piece', brand: 'Nandi Tanks' },
  { name: '750 Litre Water Tank (Nandi)', category: 'Plumbing', subcategory: 'Tanks', description: 'Triple layer Nandi water tank', price: 5200, unit: 'piece', brand: 'Nandi Tanks' },
  { name: '500 Litre Water Tank (Nandi)', category: 'Plumbing', subcategory: 'Tanks', description: 'Triple layer Nandi water tank', price: 3800, unit: 'piece', brand: 'Nandi Tanks' },
  
  // Cement
  { name: 'KCP Cement', category: 'Cement', subcategory: 'OPC', description: 'KCP high grade construction cement', price: 410, unit: 'bag', brand: 'KCP' },
  { name: 'UltraTech OPC Cement', category: 'Cement', subcategory: 'OPC', description: 'UltraTech Ordinary Portland Cement', price: 450, unit: 'bag', brand: 'UltraTech Cement' },
  { name: 'UltraTech PPC Cement', category: 'Cement', subcategory: 'PPC', description: 'UltraTech Portland Pozzolana Cement', price: 420, unit: 'bag', brand: 'UltraTech Cement' },
  { name: 'Birla White Cement', category: 'Cement', subcategory: 'White', description: 'Premium Birla White Cement for finish', price: 950, unit: 'bag', brand: 'Birla' },
  { name: 'Walker Cement', category: 'Cement', subcategory: 'PPC', description: 'Walker construction grade cement', price: 380, unit: 'bag', brand: 'Walker' },
  
  // Primers
  { name: 'ACC Primer', category: 'Paint', subcategory: 'Primers', description: 'ACC base coat wall primer', price: 1200, unit: 'bucket', brand: 'ACC' },
  { name: 'Apex Primer', category: 'Paint', subcategory: 'Primers', description: 'Asian Paints Apex exterior primer', price: 1450, unit: 'bucket', brand: 'Asian Paints' },
  
  // Paints
  { name: 'Asian Paints', category: 'Paint', subcategory: 'Paints', description: 'Asian Paints interior/exterior finish', price: 3200, unit: 'bucket', brand: 'Asian Paints' },
  { name: 'Cooling Paints', category: 'Paint', subcategory: 'Paints', description: 'Heat reflective roof cooling paint', price: 4500, unit: 'bucket', brand: 'Vasavi Supply' },
  
  // Accessories
  { name: 'Paint Brushes', category: 'Paint', subcategory: 'Accessories', description: 'Set of multi-size painting brushes', price: 250, unit: 'set', brand: 'Vasavi Supply' },
];

async function main() {
  console.log('Starting product seeding...');
  
  for (const product of productsToAdd) {
    // Check if brand exists, if not create it
    const brand = await prisma.brand.upsert({
      where: { name: product.brand },
      update: {},
      create: { name: product.brand }
    });

    const exists = await prisma.product.findFirst({
      where: { name: product.name }
    });
    
    if (!exists) {
      const { brand: brandName, ...productData } = product;
      await prisma.product.create({
        data: {
          ...productData,
          brandId: brand.id,
          stockStatus: 'In Stock',
          stockCount: 100,
          imageUrl: '/images/placeholder.png'
        }
      });
      console.log(`+ Added: ${product.name} (Brand: ${brandName})`);
    } else {
      console.log(`- Skipped (Exists): ${product.name}`);
    }
  }
  
  console.log('Seeding complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
