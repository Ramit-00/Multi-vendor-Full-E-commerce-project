const path = require('path');
const backendDir = path.join(__dirname, '..', 'backend');
const mongoose = require(path.join(backendDir, 'node_modules', 'mongoose'));
const dotenv = require(path.join(backendDir, 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(backendDir, '.env') });
const fs = require('fs');

async function backupMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI not found in backend/.env');
  }

  const dateStr = '20260907';
  const backupDir = path.join(__dirname, '..', 'backups', `pre-migration-${dateStr}`);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`[Backup] Connecting to MongoDB Atlas: ${uri.split('@')[1] || uri}...`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log(`[Backup] Found ${collections.length} collections in database "${db.databaseName}".`);

  const summary = [];

  for (const collInfo of collections) {
    const collName = collInfo.name;
    if (collName.startsWith('system.')) continue;

    const collection = db.collection(collName);
    const docs = await collection.find({}).toArray();
    const filePath = path.join(backupDir, `${collName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
    console.log(`[Backup] Wrote ${docs.length} documents for collection "${collName}" -> ${collName}.json`);
    summary.push({ collection: collName, count: docs.length, file: `${collName}.json` });
  }

  const summaryFile = path.join(backupDir, '_backup_manifest.json');
  fs.writeFileSync(summaryFile, JSON.stringify({ timestamp: new Date().toISOString(), database: db.databaseName, summary }, null, 2));

  console.log(`\n[Backup] SUCCESS: All ${summary.length} collections backed up to: ${backupDir}`);
  await mongoose.disconnect();
}

backupMongo().catch(err => {
  console.error('[Backup] Failed:', err);
  process.exit(1);
});
