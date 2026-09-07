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

async function migrateProducts() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not found in backend/.env');

  console.log(`=== 04-MIGRATE-PRODUCTS ${DRY_RUN ? '(DRY RUN)' : '(LIVE EXECUTION)'} ===`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}).toArray();
  console.log(`[04-Products] Found ${products.length} products in MongoDB.`);

  const mapping = loadMapping();
  mapping.products = mapping.products || {};

  // First available seller fallback
  const firstSeller = await prisma.seller.findFirst();
  const defaultSellerId = firstSeller ? firstSeller.id : Object.values(mapping.sellers || {})[0];

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of products) {
    const oldId = p._id.toString();
    const name = p.title || p.name || 'Product Item';
    const sku = p.sku || `SKU-${oldId.substring(16).toUpperCase()}`;
    const price = p.sellingPrice || p.mrpPrice || 999;
    const stockQuantity = typeof p.quantity === 'number' ? p.quantity : 10;
    const categoryId = p.category ? p.category.toString() : null;

    let sellerId = null;
    if (p.seller && mapping.sellers && mapping.sellers[p.seller.toString()]) {
      sellerId = mapping.sellers[p.seller.toString()];
    } else {
      sellerId = defaultSellerId;
    }

    if (!sellerId) {
      console.error(`[04-Products] Could not resolve sellerId for product ${oldId}. Skipping.`);
      errors++;
      continue;
    }

    try {
      const existing = await prisma.product.findUnique({ where: { sku } });
      if (existing) {
        mapping.products[oldId] = existing.id;
        skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`[DRY RUN] Would create product: "${name}" (SKU: ${sku}, Price: ?${price}, Stock: ${stockQuantity}, Seller: ${sellerId})`);
        created++;
        continue;
      }

      // 1. Create in Postgres
      const core = await prisma.product.create({
        data: {
          sellerId,
          categoryId,
          sku,
          name,
          price,
          stockQuantity,
          status: stockQuantity > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        }
      });

      // 2. Create in Mongo ProductDetails
      try {
        const detailsDoc = {
          productId: core.id,
          description: p.description || '',
          images: p.images || [],
          attributes: {
            color: p.color || '',
            sizes: p.sizes || '',
            discountPercent: p.discountPercent || 0,
            mrpPrice: p.mrpPrice || price,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await db.collection('productdetails').insertOne(detailsDoc);

        // Update Postgres with mongoDetailsId
        await prisma.product.update({
          where: { id: core.id },
          data: { mongoDetailsId: result.insertedId.toString() },
        });

        mapping.products[oldId] = core.id;
        created++;
        console.log(`[LIVE] Created product across both DBs: "${name}" -> Postgres UUID ${core.id}, MongoDetails: ${result.insertedId}`);
      } catch (mongoErr) {
        // Rollback Postgres write if Mongo fails
        await prisma.product.delete({ where: { id: core.id } });
        throw mongoErr;
      }
    } catch (err) {
      console.error(`[04-Products] Error migrating product ${oldId}:`, err.message);
      errors++;
    }
  }

  if (!DRY_RUN) {
    saveMapping(mapping);
    appendLog({ phase: '04-migrate-products', created, skipped, errors, total: products.length });
  }

  console.log('\n----------------------------------------------');
  console.log(`Products Migration Summary:`);
  console.log(`  Total in MongoDB : ${products.length}`);
  console.log(`  Created          : ${created}`);
  console.log(`  Skipped (Exists) : ${skipped}`);
  console.log(`  Errors           : ${errors}`);
  console.log('----------------------------------------------');

  await mongoose.disconnect();
  await prisma.$disconnect();
}

migrateProducts().catch(err => {
  console.error('[04-Products] Fatal Error:', err);
  process.exit(1);
});
