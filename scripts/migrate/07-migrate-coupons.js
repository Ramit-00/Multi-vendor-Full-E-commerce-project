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

async function migrateCoupons() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not found in backend/.env');

  console.log(`=== 07-MIGRATE-COUPONS ${DRY_RUN ? '(DRY RUN)' : '(LIVE EXECUTION)'} ===`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  const coupons = await db.collection('coupons').find({}).toArray();
  console.log(`[07-Coupons] Found ${coupons.length} coupons in MongoDB.`);

  const mapping = loadMapping();
  mapping.coupons = mapping.coupons || {};

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const c of coupons) {
    const oldId = c._id.toString();
    const code = (c.code || '').toUpperCase().trim();
    if (!code) continue;

    const discountType = (c.discountType && c.discountType.toUpperCase() === 'FLAT') ? 'FLAT' : 'PERCENTAGE';
    const discountValue = c.discountPercentage || c.discountValue || 10;
    const usesLeft = typeof c.usesLeft === 'number' ? c.usesLeft : 100;
    const expiryDate = c.validityEndDate ? new Date(c.validityEndDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    let sellerId = null;
    if (c.seller && mapping.sellers && mapping.sellers[c.seller.toString()]) {
      sellerId = mapping.sellers[c.seller.toString()];
    }

    try {
      const existing = await prisma.coupon.findUnique({ where: { code } });
      if (existing) {
        mapping.coupons[oldId] = existing.id;
        skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`[DRY RUN] Would create coupon: ${code} (${discountType} ${discountValue}, Uses: ${usesLeft})`);
        created++;
        continue;
      }

      const newCoupon = await prisma.coupon.create({
        data: {
          code,
          sellerId,
          discountType,
          discountValue,
          usesLeft,
          expiryDate,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        }
      });

      mapping.coupons[oldId] = newCoupon.id;
      created++;
      console.log(`[LIVE] Created coupon: ${code} -> UUID ${newCoupon.id}`);
    } catch (err) {
      console.error(`[07-Coupons] Error migrating coupon ${code}:`, err.message);
      errors++;
    }
  }

  // Seed default platform welcome coupon if none existed
  if (coupons.length === 0 && !DRY_RUN) {
    const welcomeCode = 'WELCOME10';
    const existing = await prisma.coupon.findUnique({ where: { code: welcomeCode } });
    if (!existing) {
      const defaultCoupon = await prisma.coupon.create({
        data: {
          code: welcomeCode,
          sellerId: null,
          discountType: 'PERCENTAGE',
          discountValue: 10,
          usesLeft: 500,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        }
      });
      console.log(`[07-Coupons] Seeded standard platform welcome coupon: ${welcomeCode} -> UUID ${defaultCoupon.id}`);
      created++;
    }
  }

  if (!DRY_RUN) {
    saveMapping(mapping);
    appendLog({ phase: '07-migrate-coupons', created, skipped, errors, total: coupons.length });
  }

  console.log('\n----------------------------------------------');
  console.log(`Coupons Migration Summary:`);
  console.log(`  Total in MongoDB : ${coupons.length}`);
  console.log(`  Created          : ${created}`);
  console.log(`  Skipped (Exists) : ${skipped}`);
  console.log(`  Errors           : ${errors}`);
  console.log('----------------------------------------------');

  await mongoose.disconnect();
  await prisma.$disconnect();
}

migrateCoupons().catch(err => {
  console.error('[07-Coupons] Fatal Error:', err);
  process.exit(1);
});
