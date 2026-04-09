const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

function resolveSeedPassword(envName, label) {
  const configured = process.env[envName];
  if (typeof configured === 'string' && configured.trim().length >= 6) {
    return { password: configured.trim(), source: 'env' };
  }

  const generated = crypto.randomBytes(12).toString('base64url');
  console.warn(`[seed_auth] ${envName} is not set. Generated a temporary ${label} password for this run.`);
  return { password: generated, source: 'generated' };
}

async function main() {
  const adminEmail = String(process.env.SEED_ADMIN_EMAIL || 'vasavi@admin.com').trim().toLowerCase();
  const demoUserEmail = String(process.env.SEED_USER_EMAIL || 'user@vasavitraders.com').trim().toLowerCase();
  const { password: adminPasswordPlain, source: adminPasswordSource } = resolveSeedPassword('SEED_ADMIN_PASSWORD', 'admin');
  const { password: userPasswordPlain, source: userPasswordSource } = resolveSeedPassword('SEED_USER_PASSWORD', 'demo user');
  const adminPassword = await bcrypt.hash(adminPasswordPlain, 12);
  const userPassword = await bcrypt.hash(userPasswordPlain, 12);

  // Admin account used by the local login page.
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Vasavi Admin',
      password: adminPassword,
      phone: '+919912517623',
      role: 'ADMIN',
    },
    create: {
      name: 'Vasavi Admin',
      email: adminEmail,
      password: adminPassword,
      phone: '+919912517623',
      role: 'ADMIN',
    },
  });

  // Demo customer account for local testing.
  await prisma.user.upsert({
    where: { email: demoUserEmail },
    update: {
      name: 'Test User',
      password: userPassword,
      phone: '8888888888',
      role: 'USER',
    },
    create: {
      name: 'Test User',
      email: demoUserEmail,
      password: userPassword,
      phone: '8888888888',
      role: 'USER',
    },
  });

  console.log(`Seeded local auth users successfully for ${adminEmail} and ${demoUserEmail}.`);
  if (adminPasswordSource === 'generated') {
    console.log(`Temporary admin password: ${adminPasswordPlain}`);
  }
  if (userPasswordSource === 'generated') {
    console.log(`Temporary demo user password: ${userPasswordPlain}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
