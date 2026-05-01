require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const prisma = new PrismaClient();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const products = await prisma.product.findMany();
  let patched = 0;
  let manual = [];

  // List all files in supabase
  const { data: files, error } = await supabase.storage.from('products').list();
  if (error) {
    console.error('Error fetching supabase files:', error);
    process.exit(1);
  }
  
  const fileNames = files.map(f => f.name);

  for (const p of products) {
    if (!p.imageUrl || p.imageUrl.trim() === '' || !p.imageUrl.startsWith('http')) {
      const isPlaceholder = p.imageUrl === '/images/placeholder.png';
      
      let matchedFile = null;
      if (!isPlaceholder && p.imageUrl) {
        const basename = p.imageUrl.split('/').pop();
        if (fileNames.includes(basename)) {
          matchedFile = basename;
        }
      }

      if (matchedFile) {
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(matchedFile);
        await prisma.product.update({
          where: { id: p.id },
          data: { imageUrl: publicUrl }
        });
        console.log(`Patched ${p.name} with ${publicUrl}`);
        patched++;
      } else {
        manual.push(p.name);
      }
    }
  }

  console.log('\n--- Migration Results ---');
  console.log(`Products Patched: ${patched}`);
  console.log(`Need Manual Re-upload: ${manual.length}`);
  if (manual.length > 0) {
    console.log('List of products needing manual upload:');
    manual.forEach(name => console.log(` - ${name}`));
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
