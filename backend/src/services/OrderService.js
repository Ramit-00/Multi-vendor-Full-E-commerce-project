const prisma = require("../config/prisma");
const OrderError = require("../exceptions/OrderError");
const OrderStatus = require("../domain/OrderStatus");
const PaymentStatus = require("../domain/PaymentStatus");

function toPrismaOrderStatus(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'PLACED' || s === 'CONFIRMED') return 'CONFIRMED';
  if (s === 'SHIPPED') return 'SHIPPED';
  if (s === 'DELIVERED') return 'DELIVERED';
  if (s === 'CANCELLED' || s === 'CANCELED') return 'CANCELLED';
  return 'PENDING';
}

function formatOrderItem(item) {
  if (!item) return null;
  const prod = item.product || {};
  return {
    id: item.id,
    _id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    sellerId: item.sellerId,
    quantity: item.quantity,
    size: 'FREE',
    mrpPrice: Number(item.unitPrice),
    sellingPrice: Number(item.unitPrice),
    subtotal: Number(item.subtotal),
    product: {
      id: prod.id || item.productId,
      _id: prod.id || item.productId,
      title: prod.name || 'Product Item',
      name: prod.name || 'Product Item',
      sku: prod.sku || '',
      price: Number(prod.price || item.unitPrice),
      sellingPrice: Number(prod.price || item.unitPrice),
      mrpPrice: Number(prod.price || item.unitPrice),
      images: [],
    },
    toObject: function() { return { ...this }; },
  };
}

function formatOrder(order) {
  if (!order) return null;
  const items = (order.orderItems || []).map(formatOrderItem);
  const totalItemCount = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
  const totalAmountNum = Number(order.totalAmount || 0);

  const user = order.user || {};
  const addr = order.shippingAddress || {};

  const firstSeller = (order.orderItems && order.orderItems[0]?.seller) || null;
  const sellerObj = firstSeller ? {
    id: firstSeller.id,
    _id: firstSeller.id,
    sellerName: firstSeller.storeName,
    storeName: firstSeller.storeName,
    businessDetails: { businessName: firstSeller.storeName },
  } : {
    id: 'default_seller',
    _id: 'default_seller',
    sellerName: 'Partner Seller',
  };

  const formattedAddr = addr.id ? {
    id: addr.id,
    _id: addr.id,
    name: user.name || 'Customer',
    address: addr.line1,
    line1: addr.line1,
    locality: addr.line2 || '',
    line2: addr.line2 || '',
    city: addr.city,
    state: addr.state,
    pinCode: addr.pincode,
    pincode: addr.pincode,
    mobile: user.phone || '9999999999',
  } : {
    name: user.name || 'Customer',
    address: 'Main Street',
    locality: 'Main',
    city: 'City',
    state: 'State',
    pinCode: '000000',
    mobile: user.phone || '9999999999',
  };

  return {
    id: order.id,
    _id: order.id,
    userId: order.userId,
    user: {
      id: user.id || order.userId,
      _id: user.id || order.userId,
      name: user.name || 'Customer',
      fullName: user.name || 'Customer',
      email: user.email || '',
      mobile: user.phone || '',
    },
    seller: sellerObj,
    shippingAddress: formattedAddr,
    totalSellingPrice: totalAmountNum,
    totalMrpPrice: totalAmountNum,
    totalAmount: totalAmountNum,
    totalItem: totalItemCount,
    orderDate: order.createdAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    orderStatus: order.status,
    status: order.status,
    orderItems: items,
    paymentDetails: {
      status: order.payment?.status || 'PENDING',
      paymentGateway: order.payment?.paymentGateway || 'PENDING',
    },
    toObject: function() { return { ...this }; },
  };
}

class OrderService {
  /**
   * Phase 7: Atomic Transactional Checkout
   * 1. Check stock >= requested quantity.
   * 2. Decrement stock atomically (stockQuantity: { decrement: qty }).
   * 3. Create Order row.
   * 4. Create OrderItem rows.
   * 5. Create Payment record.
   * Rollback cleanly on error.
   */
  async createOrder(user, shippingAddress, cart) {
    try {
      const email = (user?.email || '').toLowerCase().trim();
      let dbUser = await prisma.user.findUnique({
        where: { email },
        include: { addresses: true },
      });

      if (!dbUser && user?.id) {
        dbUser = await prisma.user.findUnique({
          where: { id: String(user.id) },
          include: { addresses: true },
        });
      }

      if (!dbUser) {
        throw new OrderError("User not found in system to complete checkout.");
      }

      // Resolve shipping address in Postgres
      let addressId = null;
      if (shippingAddress?.id && dbUser.addresses.some(a => a.id === shippingAddress.id)) {
        addressId = shippingAddress.id;
      } else if (shippingAddress?._id && dbUser.addresses.some(a => a.id === shippingAddress._id)) {
        addressId = shippingAddress._id;
      } else if (dbUser.addresses.length > 0) {
        addressId = dbUser.addresses[0].id;
      } else {
        // Create new address for user
        const createdAddr = await prisma.address.create({
          data: {
            userId: dbUser.id,
            line1: shippingAddress?.address || shippingAddress?.line1 || 'Default Address',
            line2: shippingAddress?.locality || shippingAddress?.line2 || '',
            city: shippingAddress?.city || 'City',
            state: shippingAddress?.state || 'State',
            pincode: String(shippingAddress?.pinCode || shippingAddress?.pincode || '000000'),
          },
        });
        addressId = createdAddr.id;
      }

      const cartItems = (cart && cart.cartItems && cart.cartItems.length > 0) ? cart.cartItems : [];
      if (cartItems.length === 0) {
        throw new OrderError("Cart is empty. Cannot checkout.");
      }

      // Default seller fallback if item has no resolved seller
      const defaultSeller = await prisma.seller.findFirst();
      if (!defaultSeller) {
        throw new OrderError("No active seller found on the platform.");
      }

      // Resolve items and group by seller
      const itemsBySeller = {};
      for (const item of cartItems) {
        const prodRef = item.product || {};
        const prodIdOrSku = String(prodRef.id || prodRef._id || prodRef || '');

        // Resolve product in Postgres
        let coreProduct = await prisma.product.findFirst({
          where: {
            OR: [
              { id: prodIdOrSku },
              { sku: prodIdOrSku },
              { name: prodRef.title || prodRef.name || '' },
            ],
          },
        });

        // If product was a seed string like 'men_shirt_0', check seed SKU
        if (!coreProduct && prodIdOrSku.startsWith('men_shirt_')) {
          coreProduct = await prisma.product.findFirst({ where: { sku: 'SEED-MEN-SHIRT-0' } });
        } else if (!coreProduct && prodIdOrSku.startsWith('men_tshirt_')) {
          coreProduct = await prisma.product.findFirst({ where: { sku: 'SEED-MEN-TSHIRT-1' } });
        }

        if (!coreProduct) {
          throw new OrderError(`Product not found in inventory: ${prodRef.title || prodIdOrSku}`);
        }

        let sellerId = coreProduct.sellerId || defaultSeller.id;
        if (prodRef.seller) {
          const sId = typeof prodRef.seller === 'object'
            ? String(prodRef.seller.id || prodRef.seller._id || '')
            : String(prodRef.seller);
          if (sId) {
            const sellerCheck = await prisma.seller.findUnique({ where: { id: sId } });
            if (sellerCheck) sellerId = sellerCheck.id;
          }
        }

        itemsBySeller[sellerId] = itemsBySeller[sellerId] || [];
        itemsBySeller[sellerId].push({
          cartItem: item,
          product: coreProduct,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.sellingPrice) || Number(coreProduct.price),
        });
      }

      const createdOrders = [];

      // Execute each seller order in an atomic Prisma transaction
      for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
        const totalSellingPrice = sellerItems.reduce(
          (sum, it) => sum + (it.unitPrice * it.quantity),
          0
        );

        const orderId = await prisma.$transaction(async (tx) => {
          // 1. Check stock and decrement atomically
          for (const it of sellerItems) {
            const currentStock = await tx.product.findUnique({
              where: { id: it.product.id },
              select: { id: true, stockQuantity: true, name: true },
            });

            if (!currentStock || currentStock.stockQuantity < it.quantity) {
              throw new OrderError(
                `Insufficient stock for "${currentStock?.name || it.product.name}". Available: ${currentStock?.stockQuantity || 0}, Requested: ${it.quantity}`
              );
            }

            await tx.product.update({
              where: { id: it.product.id },
              data: {
                stockQuantity: { decrement: it.quantity },
                status: currentStock.stockQuantity - it.quantity > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
              },
            });
          }

          // 2. Create Order in PostgreSQL
          const order = await tx.order.create({
            data: {
              userId: dbUser.id,
              shippingAddressId: addressId,
              totalAmount: totalSellingPrice,
              status: 'PENDING',
            },
          });

          // 3. Create OrderItems in PostgreSQL
          for (const it of sellerItems) {
            await tx.orderItem.create({
              data: {
                orderId: order.id,
                productId: it.product.id,
                sellerId: sellerId,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                subtotal: it.unitPrice * it.quantity,
              },
            });
          }

          // 4. Create Payment record in PostgreSQL
          await tx.payment.create({
            data: {
              orderId: order.id,
              amount: totalSellingPrice,
              paymentGateway: 'PENDING',
              status: 'PENDING',
            },
          });

          return order.id;
        }, {
          maxWait: 15000,
          timeout: 30000,
        });

        const fullOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            user: true,
            shippingAddress: true,
            orderItems: { include: { product: true, seller: true } },
            payment: true,
          },
        });

        createdOrders.push(formatOrder(fullOrder));
      }

      return createdOrders;
    } catch (error) {
      console.error("[OrderService] checkout transaction error:", error.message);
      throw error;
    }
  }

  async findOrderById(orderId) {
    if (!orderId) throw new OrderError("Order ID is required");

    const order = await prisma.order.findUnique({
      where: { id: String(orderId) },
      include: {
        user: true,
        shippingAddress: true,
        orderItems: { include: { product: true, seller: true } },
        payment: true,
      },
    });

    if (!order) {
      throw new OrderError(`Order not found with id ${orderId}`);
    }

    return formatOrder(order);
  }

  async findOrderItemById(orderItemId) {
    if (!orderItemId) throw new OrderError("Order Item ID is required");

    const item = await prisma.orderItem.findUnique({
      where: { id: String(orderItemId) },
      include: { product: true, seller: true },
    });

    if (!item) {
      throw new OrderError(`Order item not found with id ${orderItemId}`);
    }

    return formatOrderItem(item);
  }

  async usersOrderHistory(userId) {
    const orders = await prisma.order.findMany({
      where: { userId: String(userId) },
      include: {
        user: true,
        shippingAddress: true,
        orderItems: { include: { product: true, seller: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(formatOrder);
  }

  async getShopsOrders(sellerId) {
    const orders = await prisma.order.findMany({
      where: {
        orderItems: {
          some: { sellerId: String(sellerId) },
        },
      },
      include: {
        user: true,
        shippingAddress: true,
        orderItems: { include: { product: true, seller: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(formatOrder);
  }

  async updateOrderStatus(orderId, orderStatus) {
    const prismaStatus = toPrismaOrderStatus(orderStatus);

    const updated = await prisma.order.update({
      where: { id: String(orderId) },
      data: { status: prismaStatus },
      include: {
        user: true,
        shippingAddress: true,
        orderItems: { include: { product: true, seller: true } },
        payment: true,
      },
    });

    return formatOrder(updated);
  }

  async cancelOrder(orderId, user) {
    const order = await prisma.order.findUnique({
      where: { id: String(orderId) },
      include: { orderItems: true },
    });

    if (!order) {
      throw new OrderError(`Order not found with id ${orderId}`);
    }

    const userId = user?.id || user?._id;
    if (userId && String(order.userId) !== String(userId)) {
      throw new OrderError(`You can't perform this action on order id ${orderId}`);
    }

    // Cancel order and restore product stock atomically
    const cancelled = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
        include: {
          user: true,
          shippingAddress: true,
          orderItems: { include: { product: true, seller: true } },
          payment: true,
        },
      });

      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
            status: 'ACTIVE',
          },
        });
      }

      return o;
    });

    return formatOrder(cancelled);
  }

  async deleteOrder(orderId) {
    await prisma.order.delete({
      where: { id: String(orderId) },
    });
    return { message: "Order deleted successfully", orderId };
  }

  formatOrder(o) {
    return formatOrder(o);
  }
}

module.exports = new OrderService();
