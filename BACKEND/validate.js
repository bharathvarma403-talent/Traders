const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
let passed = 0;
let failed = 0;

function check(label, condition, fix) {
  if (condition) {
    console.log(`PASS  ${label}`);
    passed += 1;
    return;
  }

  console.log(`FAIL  ${label}`);
  console.log(`      Fix: ${fix}`);
  failed += 1;
}

function readFile(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

async function run() {
  console.log('\nVasavi Traders validation\n');

  const serverPath = path.join(__dirname, 'server.js');
  const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
  const packageJsonPath = path.join(__dirname, 'package.json');
  const envExamplePath = path.join(__dirname, '.env.example');
  const modalPath = path.join(__dirname, '../FRONTEND/src/components/Modal.jsx');
  const novaPath = path.join(__dirname, '../FRONTEND/src/pages/NovaAssistant.jsx');
  const frontendEnvPath = path.join(__dirname, '../FRONTEND/.env.local');

  const server = readFile(serverPath);
  const schema = readFile(schemaPath);
  const packageJson = readFile(packageJsonPath);
  const envExample = readFile(envExamplePath);
  const modal = readFile(modalPath);
  const nova = readFile(novaPath);

  check(
    'BACKEND/server.js exists',
    fs.existsSync(serverPath),
    'Restore BACKEND/server.js.'
  );

  check(
    'Prisma uses PostgreSQL',
    schema.includes('provider = "postgresql"'),
    'Set the datasource provider in prisma/schema.prisma to "postgresql".'
  );

  check(
    'Build scripts do not use --accept-data-loss',
    !packageJson.includes('--accept-data-loss'),
    'Remove destructive Prisma flags from package.json scripts.'
  );

  check(
    '.env.example documents refresh and bootstrap admin secrets',
    envExample.includes('JWT_REFRESH_SECRET=') &&
      envExample.includes('BOOTSTRAP_ADMIN_EMAIL=') &&
      envExample.includes('DATABASE_URL='),
    'Update BACKEND/.env.example with the current required variables.'
  );

  check(
    'Reservations list is protected by authentication',
    server.includes("app.get('/api/reservations', authenticate"),
    'Require authenticate middleware on GET /api/reservations.'
  );

  check(
    'Modal no longer fakes order success on API failure',
    !modal.includes("setTimeout(() => setStatus('success')"),
    'Remove the fake success fallback from FRONTEND/src/components/Modal.jsx.'
  );

  check(
    'Nova assistant uses the backend /api/nova endpoint',
    nova.includes("import axios from 'axios'") && nova.includes('/api/nova'),
    'Wire FRONTEND/src/pages/NovaAssistant.jsx to POST /api/nova.'
  );

  check(
    'Frontend local env includes VITE_API_URL when present',
    !fs.existsSync(frontendEnvPath) || readFile(frontendEnvPath).includes('VITE_API_URL'),
    'Set VITE_API_URL in FRONTEND/.env.local.'
  );

  try {
    await prisma.$connect();
    check('Prisma database connection succeeds', true, '');
  } catch (error) {
    check('Prisma database connection succeeds', false, error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
