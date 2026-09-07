const path = require('path');
const backendDir = path.join(__dirname, '..', 'backend');
const dotenv = require(path.join(backendDir, 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(backendDir, '.env') });

const prisma = require(path.join(backendDir, 'src', 'config', 'prisma'));
const { connectMongo, disconnectMongo, mongoose } = require(path.join(backendDir, 'src', 'config', 'mongoose'));
const ProductService = require(path.join(backendDir, 'src', 'services', 'ProductService'));
const OrderService = require(path.join(backendDir, 'src', 'services', 'OrderService'));
const UserService = require(path.join(backendDir, 'src', 'services', 'UserService'));
const SellerService = require(path.join(backendDir, 'src', 'services', 'SellerService'));
const CouponService = require(path.join(backendDir, 'src', 'services', 'CouponService'));
const buildSellerReports = require(path.join(backendDir, 'src', 'jobs', 'buildSellerReports'));
const ProductDetails = require(path.join(backendDir, 'src', 'models', 'ProductDetails'));
const SellerReport = require(path.join(backendDir, 'src', 'models', 'SelllerReposrt'));

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('=================================================================');
  console.log('       HYBRID POSTGRESQL + MONGODB INTEGRATION TEST SUITE       ');
  console.log('=================================================================\n');

  await prisma.$connect();
  await connectMongo();

  // Test 1: User & Address Retrieval (Prisma + Postgres)
  console.log('[Test 1] User and Address Polyglot Retrieval...');
  const testUser = await prisma.user.findFirst({
    where: { role: 'BUYER' },
    include: { addresses: true },
  });
  assert(!!testUser, 'Found buyer user in PostgreSQL');
  if (testUser) {
    const formatted = await UserService.findUserByEmail(testUser.email);
    assert(formatted.email === testUser.email, 'UserService returns matching email');
    assert(formatted.role === 'ROLE_CUSTOMER', 'Prisma BUYER correctly maps to ROLE_CUSTOMER');
    assert(Array.isArray(formatted.addresses), 'Addresses returned as array');
    assert(formatted._id === testUser.id, 'Backward-compatible _id is equal to Postgres UUID');
  }

  // Test 2: Polyglot Product Lifecycle (Postgres Core + Mongo ProductDetails)
  console.log('\n[Test 2] Polyglot Product Create -> Read -> Update -> Delete...');
  const firstSeller = await prisma.seller.findFirst();
  assert(!!firstSeller, 'Found active seller in PostgreSQL');

  const testSku = `TEST-POLYGLOT-${Date.now()}`;
  const createdProd = await ProductService.createProduct({
    title: 'Automated Test Polyglot T-Shirt',
    sku: testSku,
    description: 'Ultra-durable test fabric with polyglot persistence',
    sellingPrice: 799,
    mrpPrice: 1299,
    quantity: 25,
    color: 'Navy Blue',
    sizes: 'M,L,XL',
    category: 'men_topwear',
    images: ['test/navy_tshirt.png'],
  }, firstSeller);

  assert(!!createdProd.id, 'Product created with PostgreSQL UUID');
  assert(createdProd.sellingPrice === 799, 'Selling price stored correctly');
  assert(createdProd.quantity === 25, 'Stock quantity initialized in PostgreSQL');
  assert(createdProd.color === 'Navy Blue', 'Color attribute stored in Mongo ProductDetails');
  assert(createdProd.images.includes('test/navy_tshirt.png'), 'Images stored in Mongo ProductDetails');

  // Verify in MongoDB directly
  const mongoDoc = await ProductDetails.findOne({ productId: createdProd.id });
  assert(!!mongoDoc, 'Mongo ProductDetails document exists with matching productId');
  assert(mongoDoc.description === 'Ultra-durable test fabric with polyglot persistence', 'Mongo description matches');

  // Verify findProductById merges both
  const fetchedProd = await ProductService.findProductById(createdProd.id);
  assert(fetchedProd.id === createdProd.id, 'findProductById returned same ID');
  assert(fetchedProd.title === 'Automated Test Polyglot T-Shirt', 'findProductById returned title from Postgres');
  assert(fetchedProd.color === 'Navy Blue', 'findProductById merged color from Mongo ProductDetails');

  // Update product
  const updatedProd = await ProductService.updateProduct(createdProd.id, {
    title: 'Automated Test Polyglot T-Shirt (Updated)',
    sellingPrice: 849,
    quantity: 20,
    color: 'Charcoal',
  });
  assert(updatedProd.title === 'Automated Test Polyglot T-Shirt (Updated)', 'Title updated in Postgres');
  assert(updatedProd.sellingPrice === 849, 'Price updated in Postgres');
  assert(updatedProd.quantity === 20, 'Stock quantity updated in Postgres');
  assert(updatedProd.color === 'Charcoal', 'Color attribute updated in Mongo');

  // Test 3: Atomic Transactional Checkout & Concurrency
  console.log('\n[Test 3] Atomic Checkout with Stock Decrement...');
  const userForOrder = await prisma.user.findFirst({
    where: { role: 'BUYER' },
    include: { addresses: true },
  });

  const cartMock = {
    cartItems: [
      {
        product: updatedProd,
        quantity: 5,
        sellingPrice: 849,
        size: 'L',
      },
    ],
  };

  const addressMock = userForOrder.addresses[0] || {
    id: null,
    address: '123 Test Street',
    locality: 'Sector 5',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
  };

  const initialStock = (await prisma.product.findUnique({ where: { id: createdProd.id } })).stockQuantity;
  const orders = await OrderService.createOrder(userForOrder, addressMock, cartMock);

  assert(Array.isArray(orders) && orders.length > 0, 'Order successfully created in transaction');
  const postCheckoutStock = (await prisma.product.findUnique({ where: { id: createdProd.id } })).stockQuantity;
  assert(postCheckoutStock === initialStock - 5, `Stock atomically decremented from ${initialStock} to ${postCheckoutStock}`);

  const createdOrderId = orders[0].id;
  const dbOrder = await prisma.order.findUnique({
    where: { id: createdOrderId },
    include: { orderItems: true, payment: true },
  });
  assert(!!dbOrder, 'Order verified in Postgres orders table');
  assert(dbOrder.orderItems.length === 1, 'OrderItem row created with FK relation');
  assert(dbOrder.orderItems[0].productId === createdProd.id, 'OrderItem linked to product');
  assert(!!dbOrder.payment, 'Payment row created with 1-to-1 FK relation');

  // Test 4: Rollback on Insufficient Stock
  console.log('\n[Test 4] Transactional Rollback Protection (Overselling Prevention)...');
  let threwExpected = false;
  const excessiveCart = {
    cartItems: [
      {
        product: updatedProd,
        quantity: 9999, // Way higher than available stock
        sellingPrice: 849,
      },
    ],
  };

  try {
    await OrderService.createOrder(userForOrder, addressMock, excessiveCart);
  } catch (err) {
    threwExpected = true;
    assert(true, `Transaction rejected checkout with: "${err.message}"`);
  }
  assert(threwExpected, 'Order creation properly aborted due to insufficient stock');

  const postAbortStock = (await prisma.product.findUnique({ where: { id: createdProd.id } })).stockQuantity;
  assert(postAbortStock === postCheckoutStock, `Product stock remained untouched (${postAbortStock}) after transaction rollback`);

  // Test 5: Clean up created test product
  console.log('\n[Test 5] Dual-Database Cascade Cleanup...');
  // Delete order first due to FK constraint
  await prisma.order.delete({ where: { id: createdOrderId } });
  await ProductService.deleteProduct(createdProd.id);

  const deletedCore = await prisma.product.findUnique({ where: { id: createdProd.id } });
  const deletedDetails = await ProductDetails.findOne({ productId: createdProd.id });
  assert(deletedCore === null, 'Product core deleted from PostgreSQL');
  assert(deletedDetails === null, 'ProductDetails deleted from MongoDB');

  // Test 6: Coupon Atomic Usage
  console.log('\n[Test 6] Atomic Coupon Usage Decrement...');
  const defaultCoupon = await prisma.coupon.findUnique({ where: { code: 'WELCOME10' } });
  assert(!!defaultCoupon, 'WELCOME10 coupon exists in PostgreSQL');
  if (defaultCoupon) {
    const initialUses = defaultCoupon.usesLeft;
    await prisma.coupon.update({
      where: { code: 'WELCOME10' },
      data: { usesLeft: { decrement: 1 } },
    });
    const decremented = await prisma.coupon.findUnique({ where: { code: 'WELCOME10' } });
    assert(decremented.usesLeft === initialUses - 1, 'Coupon usesLeft atomically decremented in PostgreSQL');
    // Restore
    await prisma.coupon.update({
      where: { code: 'WELCOME10' },
      data: { usesLeft: { increment: 1 } },
    });
  }

  // Test 7: Background Seller Report Job
  console.log('\n[Test 7] Seller Report Aggregation Job...');
  await buildSellerReports();
  const sampleReport = await SellerReport.findOne();
  assert(!!sampleReport, 'SellerReport collection populated in MongoDB');
  if (sampleReport) {
    assert(typeof sampleReport.totalEarnings === 'number', 'SellerReport has totalEarnings number');
    assert(typeof sampleReport.totalOrders === 'number', 'SellerReport has totalOrders count');
  }

  console.log('\n=================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================================');

  await disconnectMongo();
  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
