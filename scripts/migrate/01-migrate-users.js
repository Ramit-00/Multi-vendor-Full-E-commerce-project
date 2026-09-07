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

function mapRole(roleStr) {
  if (!roleStr) return 'BUYER';
  const upper = String(roleStr).toUpperCase().trim();
  if (upper.includes('ADMIN')) return 'ADMIN';
  if (upper.includes('SELLER')) return 'SELLER';
  return 'BUYER';
}

async function migrateUsers() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not found in backend/.env');

  console.log(`=== 01-MIGRATE-USERS ${DRY_RUN ? '(DRY RUN)' : '(LIVE EXECUTION)'} ===`);
  console.log(`[01-Users] Connecting to MongoDB: ${uri.split('@')[1] || uri}...`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');
  const users = await usersCollection.find({}).toArray();

  console.log(`[01-Users] Found ${users.length} user documents in MongoDB.`);

  const mapping = loadMapping();
  mapping.users = mapping.users || {};
  mapping.usersByEmail = mapping.usersByEmail || {};

  let created = 0;
  let skipped = 0;
  let errors = 0;
  const details = [];

  for (const u of users) {
    const rawEmail = u.email;
    if (!rawEmail) {
      console.warn(`[01-Users] Skipping document ${u._id}: missing email.`);
      errors++;
      continue;
    }

    const cleanEmail = rawEmail.toLowerCase().trim();
    const oldId = u._id.toString();
    const name = u.fullName || u.name || cleanEmail.split('@')[0] || 'User';
    const passwordHash = u.password || '$2b$10$Defau1tPassw0rdHashPlaceholder1234567890';
    const phone = u.mobile || u.phone || null;
    const role = mapRole(u.role);

    try {
      const existing = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existing) {
        mapping.users[oldId] = existing.id;
        mapping.usersByEmail[cleanEmail] = existing.id;
        skipped++;
        details.push({ email: cleanEmail, oldId, newId: existing.id, status: 'SKIPPED_EXISTS' });
        continue;
      }

      if (DRY_RUN) {
        console.log(`[DRY RUN] Would create user: ${cleanEmail} (Name: "${name}", Role: ${role}, Old ID: ${oldId})`);
        created++;
        details.push({ email: cleanEmail, oldId, role, status: 'WOULD_CREATE' });
        continue;
      }

      const newUser = await prisma.user.create({
        data: {
          name,
          email: cleanEmail,
          passwordHash,
          phone,
          role,
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
        },
      });

      mapping.users[oldId] = newUser.id;
      mapping.usersByEmail[cleanEmail] = newUser.id;
      created++;
      console.log(`[LIVE] Created user: ${cleanEmail} -> UUID ${newUser.id}`);
      details.push({ email: cleanEmail, oldId, newId: newUser.id, role, status: 'CREATED' });
    } catch (err) {
      console.error(`[01-Users] Error migrating ${cleanEmail}:`, err.message);
      errors++;
      details.push({ email: cleanEmail, oldId, error: err.message, status: 'ERROR' });
    }
  }

  if (!DRY_RUN) {
    saveMapping(mapping);
    appendLog({ phase: '01-migrate-users', created, skipped, errors, total: users.length });
  }

  console.log('\n----------------------------------------------');
  console.log(`Users Migration Summary:`);
  console.log(`  Total in MongoDB : ${users.length}`);
  console.log(`  Created          : ${created}`);
  console.log(`  Skipped (Exists) : ${skipped}`);
  console.log(`  Errors           : ${errors}`);
  console.log('----------------------------------------------');

  await mongoose.disconnect();
  await prisma.$disconnect();

  return { total: users.length, created, skipped, errors, details };
}

migrateUsers().catch(err => {
  console.error('[01-Users] Fatal Error:', err);
  process.exit(1);
});
