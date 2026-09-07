const path = require('path');
const fs = require('fs');
const backendDir = path.join(__dirname, '..', 'backend');
const { PrismaClient } = require(path.join(backendDir, 'node_modules', '@prisma', 'client'));

async function applyMigration() {
  const prisma = new PrismaClient();
  const canonicalMigration = path.join(backendDir, 'prisma', 'migrations', '20260907000000_init', 'migration.sql');
  const fallbackMigration = path.join(backendDir, 'prisma', 'migration.sql');
  const sqlFile = fs.existsSync(canonicalMigration) ? canonicalMigration : fallbackMigration;
  const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

  console.log('[Migration] Connecting to Supabase PostgreSQL and applying schema DDL...');

  // Remove comment lines
  const cleanSql = sqlContent
    .split('\n')
    .map(line => line.trim().startsWith('--') ? '' : line)
    .join('\n');

  // Split by semicolon
  const statements = cleanSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`[Migration] Executing ${statements.length} SQL DDL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await prisma.$executeRawUnsafe(stmt);
      const firstLine = stmt.split('\n')[0].substring(0, 50);
      console.log(`  [${i + 1}/${statements.length}] OK: ${firstLine}...`);
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log(`  [${i + 1}/${statements.length}] Exists: ${stmt.split('\n')[0].substring(0, 50)}`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] ERROR on: ${stmt.substring(0, 80)}`, err.message);
        throw err;
      }
    }
  }

  console.log('\n[Migration] Verification - Listing all tables in public schema:');
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log('\n=== TABLES CREATED IN SUPABASE ===');
  tables.forEach(t => console.log(' -> ' + t.table_name));
  console.log(`Total: ${tables.length} tables`);

  // Record migration in _prisma_migrations table
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) NOT NULL PRIMARY KEY,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );
    `);
    const crypto = require('crypto');
    const checksum = crypto.createHash('sha256').update(sqlContent).digest('hex');
    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
      VALUES ('${id}', '${checksum}', now(), '20260907000000_init', 1)
      ON CONFLICT DO NOTHING;
    `);
    console.log('[Migration] Recorded 20260907000000_init in _prisma_migrations');
  } catch (mErr) {
    console.warn('[Migration] Note on _prisma_migrations record:', mErr.message);
  }

  await prisma.$disconnect();
}

applyMigration().catch(err => {
  console.error('[Migration] Failed:', err);
  process.exit(1);
});
