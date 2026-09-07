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

function mapPaymentStatus(statusStr) {
  if (!statusStr) return 'PENDING';
  const upper = String(statusStr).toUpperCase().trim();
  if (upper.includes('SUCCESS') || upper.includes('COMPLET') || upper.includes('PAID')) return 'SUCCESS';
  if (upper.includes('FAIL')) return 'FAILED';
  if (upper.includes('REFUND')) return 'REFUNDED';
  return 'PENDING';
}

async function migratePayments() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not found in backend/.env');

  console.log(`=== 06-MIGRATE-PAYMENTS (MERGED) ${DRY_RUN ? '(DRY RUN)' : '(LIVE EXECUTION)'} ===`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  const paymentOrders = await db.collection('paymentorders').find({}).toArray();
  const transactions = await db.collection('transactions').find({}).toArray();

  console.log(`[06-Payments] Loaded ${paymentOrders.length} paymentorders and ${transactions.length} transactions.`);

  const mapping = loadMapping();
  mapping.payments = mapping.payments || {};

  // Index paymentorders by orderId
  const poByOrder = {};
  for (const po of paymentOrders) {
    if (Array.isArray(po.orders)) {
      for (const ord of po.orders) {
        poByOrder[ord.toString()] = po;
      }
    }
  }

  // Index transactions by orderId
  const txByOrder = {};
  for (const tx of transactions) {
    if (tx.order) {
      txByOrder[tx.order.toString()] = tx;
    }
  }

  // Combine unique orders that have either a paymentorder or transaction
  const allOrderIds = new Set([...Object.keys(poByOrder), ...Object.keys(txByOrder)]);
  console.log(`[06-Payments] Found ${allOrderIds.size} unique orders needing payment records.`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const oldOrderId of allOrderIds) {
    const postgresOrderId = mapping.orders && mapping.orders[oldOrderId];
    if (!postgresOrderId) {
      console.warn(`[06-Payments] Order ${oldOrderId} not found in Postgres mapping. Skipping payment.`);
      errors++;
      continue;
    }

    const po = poByOrder[oldOrderId];
    const tx = txByOrder[oldOrderId];

    // Determine fields from matched pair
    const amount = po ? po.amount : 1499;
    const paymentGateway = (po && po.paymentMethod) || 'RAZORPAY';
    const gatewayTransactionId = (po && po.paymentLinkId) || (tx && tx._id ? tx._id.toString() : null);
    const status = mapPaymentStatus(po ? po.status : 'PENDING');
    const createdAt = po && po.createdAt ? new Date(po.createdAt) : (tx && tx.createdAt ? new Date(tx.createdAt) : new Date());

    try {
      const existing = await prisma.payment.findUnique({
        where: { orderId: postgresOrderId }
      });

      if (existing) {
        if (po) mapping.payments[po._id.toString()] = existing.id;
        if (tx) mapping.payments[tx._id.toString()] = existing.id;
        skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`[DRY RUN] Would create payment for Order ${postgresOrderId}: ?${amount}, Gateway: ${paymentGateway}, Status: ${status}`);
        created++;
        continue;
      }

      const newPayment = await prisma.payment.create({
        data: {
          orderId: postgresOrderId,
          amount,
          paymentGateway,
          gatewayTransactionId,
          status,
          createdAt,
          updatedAt: new Date()
        }
      });

      if (po) mapping.payments[po._id.toString()] = newPayment.id;
      if (tx) mapping.payments[tx._id.toString()] = newPayment.id;

      created++;
      console.log(`[LIVE] Created payment for Order ${postgresOrderId} -> UUID ${newPayment.id}`);
    } catch (err) {
      console.error(`[06-Payments] Error migrating payment for order ${oldOrderId}:`, err.message);
      errors++;
    }
  }

  if (!DRY_RUN) {
    saveMapping(mapping);
    appendLog({ phase: '06-migrate-payments', created, skipped, errors, total: allOrderIds.size });
  }

  console.log('\n----------------------------------------------');
  console.log(`Payments Migration Summary:`);
  console.log(`  Unique Orders    : ${allOrderIds.size}`);
  console.log(`  Created          : ${created}`);
  console.log(`  Skipped (Exists) : ${skipped}`);
  console.log(`  Errors           : ${errors}`);
  console.log('----------------------------------------------');

  await mongoose.disconnect();
  await prisma.$disconnect();
}

migratePayments().catch(err => {
  console.error('[06-Payments] Fatal Error:', err);
  process.exit(1);
});
