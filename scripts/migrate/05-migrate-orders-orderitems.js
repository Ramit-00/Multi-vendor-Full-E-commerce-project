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

function mapOrderStatus(statusStr) {
  if (!statusStr) return 'PENDING';
  const upper = String(statusStr).toUpperCase().trim();
  if (upper.includes('DELIVER')) return 'DELIVERED';
  if (upper.includes('SHIP')) return 'SHIPPED';
  if (upper.includes('CONFIRM')) return 'CONFIRMED';
  if (upper.includes('CANCEL')) return 'CANCELLED';
  return 'PENDING';
}

async function migrateOrders() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not found in backend/.env');

  console.log(`=== 05-MIGRATE-ORDERS & ORDER_ITEMS ${DRY_RUN ? '(DRY RUN)' : '(LIVE EXECUTION)'} ===`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  const orders = await db.collection('orders').find({}).toArray();
  const orderItems = await db.collection('orderitems').find({}).toArray();
  console.log(`[05-Orders] Found ${orders.length} orders and ${orderItems.length} order items in MongoDB.`);

  const mapping = loadMapping();
  mapping.orders = mapping.orders || {};
  mapping.orderItems = mapping.orderItems || {};

  // Build map of orderitem _id -> item doc
  const itemMap = {};
  for (const item of orderItems) {
    itemMap[item._id.toString()] = item;
  }

  // Ensure default seller & products for seed items (men_shirt_0, men_tshirt_1)
  const defaultSeller = await prisma.seller.findFirst();
  if (!defaultSeller) throw new Error('No seller found in Postgres! Run 02-migrate-sellers.js first.');
  const defaultUser = await prisma.user.findFirst();
  const defaultAddress = await prisma.address.findFirst();

  // Ensure seed products in Postgres mapping
  const seedProducts = [
    { key: 'men_shirt_0', sku: 'SEED-MEN-SHIRT-0', name: 'Classic Men Oxford Shirt', price: 1499 },
    { key: 'men_tshirt_1', sku: 'SEED-MEN-TSHIRT-1', name: 'Men Casual Graphic T-Shirt', price: 699 }
  ];

  for (const sp of seedProducts) {
    if (!mapping.products[sp.key]) {
      let existingP = await prisma.product.findUnique({ where: { sku: sp.sku } });
      if (!existingP && !DRY_RUN) {
        existingP = await prisma.product.create({
          data: {
            sellerId: defaultSeller.id,
            sku: sp.sku,
            name: sp.name,
            price: sp.price,
            stockQuantity: 100,
            status: 'ACTIVE'
          }
        });
        console.log(`[05-Orders] Created backing seed product: ${sp.name} -> ${existingP.id}`);
      }
      if (existingP) {
        mapping.products[sp.key] = existingP.id;
      }
    }
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const o of orders) {
    const oldOrderId = o._id.toString();

    // 1. Resolve userId
    const oldUserId = o.user ? (typeof o.user === 'object' ? o.user.toString() : o.user) : null;
    const userId = (oldUserId && mapping.users && mapping.users[oldUserId]) || defaultUser.id;

    // 2. Resolve addressId
    let addressId = null;
    if (o.shippingAddress) {
      if (typeof o.shippingAddress === 'object' && o.shippingAddress._id) {
        addressId = mapping.addresses[o.shippingAddress._id.toString()];
      } else if (typeof o.shippingAddress === 'string') {
        addressId = mapping.addresses[o.shippingAddress];
      }
    }
    if (!addressId) addressId = defaultAddress.id;

    // 3. Resolve order items
    const rawItemIds = Array.isArray(o.orderItems) ? o.orderItems : [];
    const itemsToCreate = [];
    let itemsFailed = false;

    for (const rawId of rawItemIds) {
      const itemKey = typeof rawId === 'object' ? (rawId._id || rawId).toString() : rawId.toString();
      const itemDoc = itemMap[itemKey];
      if (!itemDoc) {
        console.warn(`[05-Orders] OrderItem ${itemKey} not found for Order ${oldOrderId}.`);
        continue;
      }

      const prodKey = itemDoc.product ? (typeof itemDoc.product === 'object' ? itemDoc.product.toString() : itemDoc.product) : null;
      const resolvedProdId = mapping.products && mapping.products[prodKey];

      if (!resolvedProdId) {
        console.error(`[05-Orders] Product ${prodKey} for item ${itemKey} not resolved. Order ${oldOrderId} skipped.`);
        itemsFailed = true;
        break;
      }

      const qty = itemDoc.quantity || 1;
      const unitPrice = itemDoc.sellingPrice || itemDoc.mrpPrice || 999;
      const subtotal = unitPrice * qty;

      itemsToCreate.push({
        oldItemId: itemKey,
        productId: resolvedProdId,
        sellerId: defaultSeller.id,
        quantity: qty,
        unitPrice,
        subtotal
      });
    }

    if (itemsFailed || itemsToCreate.length === 0) {
      console.warn(`[05-Orders] Skipping order ${oldOrderId} due to missing item resolution.`);
      errors++;
      continue;
    }

    const totalAmount = o.totalSellingPrice || o.totalMrpPrice || itemsToCreate.reduce((sum, it) => sum + it.subtotal, 0);
    const status = mapOrderStatus(o.orderStatus);

    try {
      if (mapping.orders[oldOrderId]) {
        const existingOrder = await prisma.order.findUnique({ where: { id: mapping.orders[oldOrderId] } });
        if (existingOrder) {
          skipped++;
          continue;
        }
      }

      if (DRY_RUN) {
        console.log(`[DRY RUN] Would create order ${oldOrderId}: ?${totalAmount}, Status: ${status}, Items: ${itemsToCreate.length}`);
        created++;
        continue;
      }

      // Atomic Prisma Transaction
      const newOrder = await prisma.$transaction(async (tx) => {
        const ord = await tx.order.create({
          data: {
            userId,
            shippingAddressId: addressId,
            totalAmount,
            status,
            createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
            updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date(),
            orderItems: {
              create: itemsToCreate.map(it => ({
                productId: it.productId,
                sellerId: it.sellerId,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                subtotal: it.subtotal
              }))
            }
          },
          include: { orderItems: true }
        });

        return ord;
      });

      mapping.orders[oldOrderId] = newOrder.id;
      for (let idx = 0; idx < itemsToCreate.length; idx++) {
        const it = itemsToCreate[idx];
        const createdItem = newOrder.orderItems[idx];
        if (createdItem) {
          mapping.orderItems[it.oldItemId] = createdItem.id;
        }
      }

      created++;
      console.log(`[LIVE] Created order: ${oldOrderId} -> UUID ${newOrder.id} with ${newOrder.orderItems.length} items.`);
    } catch (err) {
      console.error(`[05-Orders] Transaction failed for order ${oldOrderId}:`, err.message);
      errors++;
    }
  }

  if (!DRY_RUN) {
    saveMapping(mapping);
    appendLog({ phase: '05-migrate-orders', created, skipped, errors, total: orders.length });
  }

  console.log('\n----------------------------------------------');
  console.log(`Orders Migration Summary:`);
  console.log(`  Total in MongoDB : ${orders.length}`);
  console.log(`  Created          : ${created}`);
  console.log(`  Skipped (Exists) : ${skipped}`);
  console.log(`  Errors           : ${errors}`);
  console.log('----------------------------------------------');

  await mongoose.disconnect();
  await prisma.$disconnect();
}

migrateOrders().catch(err => {
  console.error('[05-Orders] Fatal Error:', err);
  process.exit(1);
});
