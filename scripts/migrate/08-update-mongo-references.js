const path = require('path');
const fs = require('fs');
const backendDir = path.join(__dirname, '..', '..', 'backend');
const mongoose = require(path.join(backendDir, 'node_modules', 'mongoose'));
const dotenv = require(path.join(backendDir, 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(backendDir, '.env') });

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

async function updateMongoReferences() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not found in backend/.env');

  console.log(`=== 08-UPDATE-MONGO-REFERENCES ${DRY_RUN ? '(DRY RUN)' : '(LIVE EXECUTION)'} ===`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  const mapping = loadMapping();

  const defaultUserUuid = Object.values(mapping.users || {})[0];
  const defaultSellerUuid = Object.values(mapping.sellers || {})[0];

  // 1. Update wishlists
  console.log('\n[08-Refs] Updating wishlists...');
  const wishlists = await db.collection('wishlists').find({}).toArray();
  let updatedWishlists = 0;
  for (const w of wishlists) {
    const oldUserId = w.user ? w.user.toString() : null;
    const newUserId = (oldUserId && mapping.users[oldUserId]) || defaultUserUuid;

    const oldProductIds = Array.isArray(w.products) ? w.products : [];
    const newProductIds = oldProductIds.map(p => {
      const pStr = p.toString();
      return mapping.products[pStr] || pStr;
    });

    if (!DRY_RUN) {
      await db.collection('wishlists').updateOne(
        { _id: w._id },
        { $set: { user: newUserId, products: newProductIds } }
      );
    }
    updatedWishlists++;
  }
  console.log(`[08-Refs] Wishlists: ${updatedWishlists} records updated.`);

  // 2. Update carts & cartitems
  console.log('\n[08-Refs] Updating carts & cartitems...');
  const carts = await db.collection('carts').find({}).toArray();
  let updatedCarts = 0;
  for (const c of carts) {
    const oldUserId = c.user ? c.user.toString() : null;
    const newUserId = (oldUserId && mapping.users[oldUserId]) || defaultUserUuid;

    if (!DRY_RUN) {
      await db.collection('carts').updateOne(
        { _id: c._id },
        { $set: { user: newUserId } }
      );
    }
    updatedCarts++;
  }
  console.log(`[08-Refs] Carts: ${updatedCarts} records updated.`);

  const cartItems = await db.collection('cartitems').find({}).toArray();
  let updatedCartItems = 0;
  for (const ci of cartItems) {
    const oldUserId = ci.userId ? ci.userId.toString() : null;
    const newUserId = (oldUserId && mapping.users[oldUserId]) || defaultUserUuid;

    const oldProdId = ci.product ? ci.product.toString() : null;
    const newProdId = (oldProdId && mapping.products[oldProdId]) || oldProdId;

    if (!DRY_RUN) {
      await db.collection('cartitems').updateOne(
        { _id: ci._id },
        { $set: { userId: newUserId, product: newProdId } }
      );
    }
    updatedCartItems++;
  }
  console.log(`[08-Refs] CartItems: ${updatedCartItems} records updated.`);

  // 3. Update sellerreports
  console.log('\n[08-Refs] Updating sellerreports...');
  const sellerReports = await db.collection('sellerreports').find({}).toArray();
  let updatedReports = 0;
  for (const sr of sellerReports) {
    const oldSellerId = sr.seller ? sr.seller.toString() : null;
    const newSellerId = (oldSellerId && mapping.sellers[oldSellerId]) || defaultSellerUuid;

    if (!DRY_RUN) {
      await db.collection('sellerreports').updateOne(
        { _id: sr._id },
        { $set: { seller: newSellerId } }
      );
    }
    updatedReports++;
  }
  console.log(`[08-Refs] SellerReports: ${updatedReports} records updated.`);

  // 4. Update reviews if any exist
  const reviews = await db.collection('reviews').find({}).toArray();
  let updatedReviews = 0;
  for (const r of reviews) {
    const oldUserId = r.user ? r.user.toString() : null;
    const newUserId = (oldUserId && mapping.users[oldUserId]) || defaultUserUuid;

    const oldProdId = r.product ? r.product.toString() : null;
    const newProdId = (oldProdId && mapping.products[oldProdId]) || oldProdId;

    if (!DRY_RUN) {
      await db.collection('reviews').updateOne(
        { _id: r._id },
        { $set: { user: newUserId, product: newProdId } }
      );
    }
    updatedReviews++;
  }
  console.log(`[08-Refs] Reviews: ${updatedReviews} records updated.`);

  if (!DRY_RUN) {
    appendLog({
      phase: '08-update-mongo-references',
      updatedWishlists,
      updatedCarts,
      updatedCartItems,
      updatedReports,
      updatedReviews
    });
  }

  console.log('\n----------------------------------------------');
  console.log('Mongo Reference Updates Complete!');
  console.log(`  Wishlists   : ${updatedWishlists}`);
  console.log(`  Carts       : ${updatedCarts}`);
  console.log(`  CartItems   : ${updatedCartItems}`);
  console.log(`  Reports     : ${updatedReports}`);
  console.log(`  Reviews     : ${updatedReviews}`);
  console.log('----------------------------------------------');

  await mongoose.disconnect();
}

updateMongoReferences().catch(err => {
  console.error('[08-Refs] Fatal Error:', err);
  process.exit(1);
});
