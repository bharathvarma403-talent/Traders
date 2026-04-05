/**
 * validate.js — Run with: node validate.js
 * Checks that Agents 1, 2, 3 resolved the 5 RCA failures.
 */
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const fs   = require('fs');
const path = require('path');

const prisma = new PrismaClient();
let passed = 0, failed = 0;

function check(label, condition, fix) {
  if (condition) {
    console.log(`  ✅ PASS  ${label}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL  ${label}`);
    console.log(`         Fix: ${fix}`);
    failed++;
  }
}

async function run() {
  console.log('\n🔍 Vasavi Traders — RCA Fix Validation\n');

  // F-1: server.js exists
  check(
    'F-1: BACKEND/server.js exists',
    fs.existsSync(path.join(__dirname, 'server.js')),
    'Agent 1 must create BACKEND/server.js'
  );

  // F-2: schema.prisma uses sqlite
  const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    check(
      'F-2: schema.prisma provider = sqlite',
      schema.includes('provider = "sqlite"'),
      'Agent 3 must change provider to "sqlite" in prisma/schema.prisma'
    );
  } else {
    check('F-2: schema.prisma provider = sqlite', false, 'prisma/schema.prisma missing');
  }

  // F-2: Prisma DB actually connects
  try {
    await prisma.$connect();
    check('F-2: Prisma DB connection succeeds', true, '');
    await prisma.$disconnect();
  } catch (e) {
    check('F-2: Prisma DB connection succeeds', false, `DB error: ${e.message}`);
  }

  // F-3: FRONTEND .env.local exists
  const envLocalPath = path.join(__dirname, '../FRONTEND/.env.local');
  check(
    'F-3: FRONTEND/.env.local exists with VITE_API_URL',
    fs.existsSync(envLocalPath) &&
    fs.readFileSync(envLocalPath, 'utf8')
      .includes('VITE_API_URL'),
    'Agent 3 must create FRONTEND/.env.local with VITE_API_URL=http://localhost:4000'
  );

  // F-4: Modal.jsx no longer contains fake success
  const modalPath = path.join(__dirname, '../FRONTEND/src/components/Modal.jsx');
  if (fs.existsSync(modalPath)) {
    const modal = fs.readFileSync(modalPath, 'utf8');
    check(
      "F-4: Modal.jsx catch block does NOT contain fake setTimeout success",
      !modal.includes("setTimeout(() => setStatus('success')"),
      "Agent 2 must remove the fake success setTimeout from Modal.jsx's catch block"
    );
  } else {
    check("F-4: Modal.jsx catch block does NOT contain fake setTimeout success", false, "FRONTEND/src/components/Modal.jsx missing");
  }

  // F-5: NovaAssistant.jsx imports axios
  const novaPath = path.join(__dirname, '../FRONTEND/src/pages/NovaAssistant.jsx');
  if (fs.existsSync(novaPath)) {
    const nova = fs.readFileSync(novaPath, 'utf8');
    check(
      "F-5: NovaAssistant.jsx imports axios",
      nova.includes("import axios from 'axios'"),
      "Agent 2 must add axios import to NovaAssistant.jsx"
    );
    check(
      'F-5: NovaAssistant.jsx calls /api/nova endpoint',
      nova.includes('/api/nova'),
      'Agent 2 must wire submitQuery() to POST /api/nova'
    );
  } else {
    check("F-5: NovaAssistant.jsx checks", false, "FRONTEND/src/pages/NovaAssistant.jsx missing");
  }

  // F-1: server.js defines /api/nova route
  const serverPath = path.join(__dirname, 'server.js');
  if (fs.existsSync(serverPath)) {
    const server = fs.readFileSync(serverPath, 'utf8');
    check(
      "F-1/F-5: server.js defines POST /api/nova route",
      server.includes("'/api/nova'") || server.includes('"/api/nova"'),
      'Agent 1 must add the POST /api/nova route to server.js'
    );
  } else {
    check("F-1/F-5: server.js defines POST /api/nova route", false, "BACKEND/server.js missing");
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Result: ${passed} passed · ${failed} failed`);
  if (failed === 0) {
    console.log('  🎉 All RCA fixes validated successfully.\n');
  } else {
    console.log('  ⚠️  Fix the failures above before merging.\n');
    process.exit(1);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
