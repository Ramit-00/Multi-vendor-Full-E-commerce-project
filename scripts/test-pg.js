const path = require('path');
const backendDir = path.join(__dirname, '..', 'backend');
const prisma = require(path.join(backendDir, 'src', 'config', 'prisma'));

async function checkEmpty() {
  const counts = {
    users: await prisma.user.count(),
    sellers: await prisma.seller.count(),
    addresses: await prisma.address.count(),
    products: await prisma.product.count(),
    orders: await prisma.order.count(),
    order_items: await prisma.orderItem.count(),
    payments: await prisma.payment.count(),
    seller_payouts: await prisma.sellerPayout.count(),
    coupons: await prisma.coupon.count(),
    refunds: await prisma.refund.count()
  };

  console.log('\n=== SUPABASE TABLE ROW COUNTS (Prisma Client) ===');
  for (const [table, count] of Object.entries(counts)) {
    console.log(` -> ${table.padEnd(16)}: ${count} rows`);
  }

  await prisma.$disconnect();
}

checkEmpty().catch(err => {
  console.error('Count error:', err);
  process.exit(1);
});
