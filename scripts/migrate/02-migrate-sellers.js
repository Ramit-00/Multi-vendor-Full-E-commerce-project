const path = require('path');
const fs = require('fs');
const backendDir = path.join(__dirname, '..', '..', 'backend');
const mongoose = require(path.join(backendDir, 'node_modules', 'mongoose'));
const dotenv = require(path.join(backendDir, 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(backendDir, '.env') });
const prisma = require(path.join(backendDir, 'src', 'config', 'prisma'));

const DRY_RUN = process.argv.includes('--dry-run');
const MAPPING_PATH = path.join(__dirname, 'id-mapping.json');
const LOG_PATH = path.join(__dirname, 'migration-log.json');

function loadMapping() {
  if (fs.existsSync(MAPPING_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveMapping(mapping) {
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2), 'utf-8');
}

function appendLog(entry) {
  let logs = [];
  if (fs.existsSync(LOG_PATH)) {
    try {
      logs = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
    } catch (e) {
      logs = [];
    }
  }
  logs.push({ timestamp: new Date().toISOString(), ...entry });
  fs.writeFileSync(LOG_PATH, JSON.stringify(logs, null, 2), 'utf-8');
}

async function migrateSellers() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not found in backend/.env');

  console.log(`=== 02-MIGRATE-SELLERS ${DRY_RUN ? '(DRY RUN)' : '(LIVE EXECUTION)'} ===`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  const sellers = await db.collection('sellers').find({}).toArray();
  console.log(`[02-Sellers] Found ${sellers.length} seller documents in MongoDB.`);

  const mapping = loadMapping();
  mapping.sellers = mapping.sellers || {};
  mapping.sellersByEmail = mapping.sellersByEmail || {};

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const s of sellers) {
    const oldId = s._id.toString();
    const email = (s.email || '').toLowerCase().trim();
    const storeName = s.businessDetails?.businessName || s.sellerName || 'Verified Merchant';

    // 1. Resolve userId
    let userId = null;
    if (s.user && mapping.users && mapping.users[s.user.toString()]) {
      userId = mapping.users[s.user.toString()];
    } else if (email && mapping.usersByEmail && mapping.usersByEmail[email]) {
      userId = mapping.usersByEmail[email];
    }

    // If still missing, check or create User in Prisma
    if (!userId && email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        userId = existingUser.id;
        if (!mapping.usersByEmail) mapping.usersByEmail = {};
        mapping.usersByEmail[email] = existingUser.id;
      } else if (!DRY_RUN) {
        // Create user with SELLER role
        const newUser = await prisma.user.create({
          data: {
            name: s.sellerName || storeName,
            email,
            passwordHash: s.password || '$2b$10$Defau1tPassw0rdHashPlaceholder1234567890',
            phone: s.mobile || null,
            role: 'SELLER',
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          }
        });
        userId = newUser.id;
        mapping.usersByEmail[email] = newUser.id;
        console.log(`[02-Sellers] Created backing User account for seller ${email} -> ${userId}`);
      } else {
        userId = 'DRY_RUN_USER_UUID';
      }
    }

    if (!userId) {
      console.error(`[02-Sellers] Could not resolve userId for seller ${oldId} (${email}). Skipping.`);
      errors++;
      continue;
    }

    const payoutAccountInfo = {
      bankDetails: s.bankDetails || {},
      businessDetails: s.businessDetails || {},
      gstin: s.GSTIN || '',
      mobile: s.mobile || '',
    };

    const verificationStatus = (s.accountStatus || 'ACTIVE').toLowerCase();

    try {
      const existing = await prisma.seller.findUnique({
        where: { userId },
      });

      if (existing) {
        mapping.sellers[oldId] = existing.id;
        mapping.sellersByEmail[email] = existing.id;
        skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`[DRY RUN] Would create seller: "${storeName}" (Email: ${email}, User ID: ${userId}, Old ID: ${oldId})`);
        created++;
        continue;
      }

      const newSeller = await prisma.seller.create({
        data: {
          userId,
          storeName,
          payoutAccountInfo,
          verificationStatus,
          commissionRate: 0.10,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
        }
      });

      mapping.sellers[oldId] = newSeller.id;
      mapping.sellersByEmail[email] = newSeller.id;
      created++;
      console.log(`[LIVE] Created seller: "${storeName}" -> UUID ${newSeller.id}`);
    } catch (err) {
      console.error(`[02-Sellers] Error migrating seller ${oldId}:`, err.message);
      errors++;
    }
  }

  if (!DRY_RUN) {
    saveMapping(mapping);
    appendLog({ phase: '02-migrate-sellers', created, skipped, errors, total: sellers.length });
  }

  console.log('\n----------------------------------------------');
  console.log(`Sellers Migration Summary:`);
  console.log(`  Total in MongoDB : ${sellers.length}`);
  console.log(`  Created          : ${created}`);
  console.log(`  Skipped (Exists) : ${skipped}`);
  console.log(`  Errors           : ${errors}`);
  console.log('----------------------------------------------');

  await mongoose.disconnect();
  await prisma.$disconnect();
}

migrateSellers().catch(err => {
  console.error('[02-Sellers] Fatal Error:', err);
  process.exit(1);
});
