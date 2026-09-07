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

async function migrateAddresses() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not found in backend/.env');

  console.log(`=== 03-MIGRATE-ADDRESSES ${DRY_RUN ? '(DRY RUN)' : '(LIVE EXECUTION)'} ===`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  const addresses = await db.collection('addresses').find({}).toArray();
  const users = await db.collection('users').find({}).toArray();
  const sellers = await db.collection('sellers').find({}).toArray();
  console.log(`[03-Addresses] Found ${addresses.length} addresses in MongoDB.`);

  const mapping = loadMapping();
  mapping.addresses = mapping.addresses || {};

  // Build addressId -> userId map from users and sellers
  const addressToUser = {};
  for (const u of users) {
    const userUuid = mapping.users && mapping.users[u._id.toString()];
    if (userUuid && Array.isArray(u.addresses)) {
      for (const aId of u.addresses) {
        addressToUser[aId.toString()] = userUuid;
      }
    }
  }

  for (const s of sellers) {
    const sellerUuid = mapping.sellers && mapping.sellers[s._id.toString()];
    const userUuid = (mapping.usersByEmail && mapping.usersByEmail[s.email?.toLowerCase()?.trim()]) || (s.user && mapping.users[s.user.toString()]);
    if (userUuid && s.pickupAddress) {
      addressToUser[s.pickupAddress.toString()] = userUuid;
    }
  }

  // Fallback user if orphan address (use first admin)
  const defaultUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const defaultUserId = defaultUser ? defaultUser.id : Object.values(mapping.users || {})[0];

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const a of addresses) {
    const oldId = a._id.toString();
    const userId = addressToUser[oldId] || defaultUserId;

    if (!userId) {
      console.warn(`[03-Addresses] Address ${oldId} has no owner user. Skipping.`);
      errors++;
      continue;
    }

    const line1 = a.address || a.locality || a.name || 'Standard Delivery Address';
    const line2 = a.locality || a.name || null;
    const city = a.city || 'City';
    const state = a.state || 'State';
    const pincode = String(a.pinCode || a.pincode || '000000').trim();

    try {
      if (mapping.addresses[oldId]) {
        const existing = await prisma.address.findUnique({ where: { id: mapping.addresses[oldId] } });
        if (existing) {
          skipped++;
          continue;
        }
      }

      if (DRY_RUN) {
        created++;
        continue;
      }

      const newAddress = await prisma.address.create({
        data: {
          userId,
          line1,
          line2,
          city,
          state,
          pincode,
          isDefault: false,
          createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
        }
      });

      mapping.addresses[oldId] = newAddress.id;
      created++;
    } catch (err) {
      console.error(`[03-Addresses] Error migrating address ${oldId}:`, err.message);
      errors++;
    }
  }

  if (!DRY_RUN) {
    saveMapping(mapping);
    appendLog({ phase: '03-migrate-addresses', created, skipped, errors, total: addresses.length });
  }

  console.log('\n----------------------------------------------');
  console.log(`Addresses Migration Summary:`);
  console.log(`  Total in MongoDB : ${addresses.length}`);
  console.log(`  Created          : ${created}`);
  console.log(`  Skipped (Exists) : ${skipped}`);
  console.log(`  Errors           : ${errors}`);
  console.log('----------------------------------------------');

  await mongoose.disconnect();
  await prisma.$disconnect();
}

migrateAddresses().catch(err => {
  console.error('[03-Addresses] Fatal Error:', err);
  process.exit(1);
});
