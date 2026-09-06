const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const User = require("../models/User");
const OrderItem = require("../models/OrderItem");
const CartService = require("../services/CartService");
const OrderError = require("../exceptions/OrderError");
const OrderStatus = require("../domain/OrderStatus");
const PaymentStatus = require("../domain/PaymentStatus");
const mongoose = require("mongoose");
const TransactionService = require("./TransactionService");

class OrderService {
  async createOrder(user, shippingAddress, cart) {
    console.log("shpping address: start", shippingAddress);
    try {
      if (!shippingAddress) {
        shippingAddress = {
          name: user.fullName || (user.email ? user.email.split('@')[0] : "Customer"),
          address: "Default Delivery Address",
          locality: "Main",
          city: "New Delhi",
          state: "Delhi",
          pinCode: "110001",
          mobile: "9999999999"
        };
      }

      shippingAddress.locality = shippingAddress.locality || shippingAddress.city || "Main";
      let addressId = shippingAddress._id;
      if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
        try {
          const createdAddr = await Address.create({
            name: shippingAddress.name || "Customer",
            locality: shippingAddress.locality || "Main",
            address: shippingAddress.address || "Main Street",
            city: shippingAddress.city || "City",
            state: shippingAddress.state || "State",
            pinCode: shippingAddress.pinCode || "110001",
            mobile: shippingAddress.mobile || "9999999999"
          });
          addressId = createdAddr._id;
        } catch (addrErr) {
          addressId = new mongoose.Types.ObjectId();
        }
      }

      if (user && user._id) {
        if (!Array.isArray(user.addresses)) user.addresses = [];
        if (addressId && mongoose.Types.ObjectId.isValid(addressId) && !user.addresses.some(a => String(a._id || a) === String(addressId))) {
          user.addresses.push(addressId);
          try {
            await User.findByIdAndUpdate(user._id, { addresses: user.addresses });
          } catch (uErr) {}
        }
      }

      const cartItems = (cart && cart.cartItems && cart.cartItems.length > 0) ? cart.cartItems : [];

      const itemsBySeller = cartItems.reduce((acc, item) => {
        let sellerId = "seller_default";
        if (item.product && item.product.seller) {
          if (typeof item.product.seller === 'object') {
            sellerId = String(item.product.seller._id || item.product.seller.id || "seller_default");
          } else {
            sellerId = String(item.product.seller);
          }
        }
        acc[sellerId] = acc[sellerId] || [];
        acc[sellerId].push(item);
        return acc;
      }, {});

      const orders = [];

      for (const [sellerId, sCartItems] of Object.entries(itemsBySeller)) {
        const totalOrderPrice = sCartItems.reduce(
          (sum, item) => sum + Number(item.sellingPrice || 0),
          0
        );
        const totalItemCount = sCartItems.reduce(
          (sum, item) => sum + Number(item.quantity || 1),
          0
        );

        const newOrder = new Order({
          user: user._id || user.id || "user_guest",
          seller: sellerId,
          totalMrpPrice: totalOrderPrice,
          totalSellingPrice: totalOrderPrice,
          totalItem: totalItemCount,
          shippingAddress: addressId,
          orderStatus: OrderStatus.PENDING,
          paymentDetails: { status: PaymentStatus.PENDING },
          orderItems: [],
        });

        const orderItems = await Promise.all(
          sCartItems.map(async (cartItem) => {
            const prodId = cartItem.product?._id || cartItem.product?.id || cartItem.product || "prod_default";
            const orderItem = new OrderItem({
              mrpPrice: cartItem.mrpPrice || cartItem.sellingPrice || 0,
              product: prodId,
              quantity: cartItem.quantity || 1,
              size: cartItem.size || "FREE",
              userId: user._id || user.id || "user_guest",
              sellingPrice: cartItem.sellingPrice || 0,
            });

            try {
              const savedOrderItem = await orderItem.save();
              newOrder.orderItems.push(savedOrderItem._id);
              return savedOrderItem;
            } catch (itemSaveErr) {
              const fallbackItem = { ...orderItem.toObject(), _id: `item_${Date.now()}` };
              newOrder.orderItems.push(fallbackItem._id);
              return fallbackItem;
            }
          })
        );

        let savedOrder;
        try {
          savedOrder = await newOrder.save();
          try { TransactionService.createTransaction(savedOrder._id); } catch(tErr) {}
        } catch (orderSaveErr) {
          savedOrder = { ...newOrder.toObject(), _id: `order_${Date.now()}` };
        }

        orders.push(savedOrder);
      }

      return orders;
    
   } catch (error) {
    console.log("orderr error ", error)
    throw new Error(error.message)
   }
  }

  async findOrderById(orderId) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new OrderError("Invalid Order ID...");
    }
    let order = await Order.findById(orderId).populate([
      { path: "seller" },
      { path: "shippingAddress" },
      { path: "orderItems", populate: { path: "product" } },
    ]);

    if (!order) {
      throw new OrderError(`Order not found with id ${orderId}`);
    }

    order = order.toObject();

    // Fallback population if refs are mixed
    const Product = require("../models/Product");
    const Seller = require("../models/Seller");

    if (order.shippingAddress && (typeof order.shippingAddress === 'string' || !order.shippingAddress.address)) {
      try {
        const addr = await Address.findById(order.shippingAddress);
        if (addr) order.shippingAddress = addr;
      } catch (e) {}
    }

    if (order.seller && (typeof order.seller === 'string' || !order.seller.sellerName)) {
      try {
        const sel = await Seller.findById(order.seller);
        if (sel) order.seller = sel;
      } catch (e) {}
    }

    if (Array.isArray(order.orderItems)) {
      const populatedItems = [];
      for (const rawItem of order.orderItems) {
        let item = rawItem;
        if (!item || !item.size || typeof item === 'string' || item instanceof mongoose.Types.ObjectId) {
          try {
            const dbItem = await OrderItem.findById(item?._id || item);
            if (dbItem) item = dbItem.toObject();
          } catch (e) {}
        }
        if (item && typeof item === 'object') {
          if (item.product && (typeof item.product === 'string' || !item.product.title)) {
            try {
              const prod = await Product.findById(item.product._id || item.product).populate("seller");
              if (prod) item.product = prod;
            } catch (e) {}
          }
          populatedItems.push(item);
        }
      }
      if (populatedItems.length > 0) order.orderItems = populatedItems;
    }

    return order;
  }

  async findOrderItemById(orderItemId) {
    if (!mongoose.Types.ObjectId.isValid(orderItemId)) {
      throw new OrderError("Invalid Order Item ID...");
    }

    let orderItem = await OrderItem.findById(orderItemId).populate([
      { path: "product", populate: { path: "seller" } },
    ]);

    if (!orderItem) {
      throw new OrderError(`Order item not found with id ${orderItemId}`);
    }

    orderItem = orderItem.toObject();

    const Product = require("../models/Product");
    if (orderItem.product && (typeof orderItem.product === 'string' || !orderItem.product.title)) {
      try {
        const prod = await Product.findById(orderItem.product._id || orderItem.product).populate("seller");
        if (prod) {
          orderItem.product = prod;
        }
      } catch (e) {}
    }

    return orderItem;
  }

  async usersOrderHistory(userId) {
    const rawOrders = await Order.find({ user: userId }).sort({ orderDate: -1 }).populate([
      { path: "seller" },
      { path: "shippingAddress" },
      { path: "orderItems", populate: { path: "product" } },
    ]);

    const Product = require("../models/Product");
    const Seller = require("../models/Seller");

    const orders = [];
    for (const rawOrder of rawOrders) {
      let order = rawOrder.toObject();
      if (order.shippingAddress && (typeof order.shippingAddress === 'string' || !order.shippingAddress.address)) {
        try {
          const addr = await Address.findById(order.shippingAddress);
          if (addr) order.shippingAddress = addr;
        } catch (e) {}
      }
      if (order.seller && (typeof order.seller === 'string' || !order.seller.sellerName)) {
        try {
          const sel = await Seller.findById(order.seller);
          if (sel) order.seller = sel;
        } catch (e) {}
      }
      if (Array.isArray(order.orderItems)) {
        const populatedItems = [];
        for (const rawItem of order.orderItems) {
          let item = rawItem;
          if (!item || !item.size || typeof item === 'string' || item instanceof mongoose.Types.ObjectId) {
            try {
              const dbItem = await OrderItem.findById(item?._id || item);
              if (dbItem) item = dbItem.toObject();
            } catch (e) {}
          }
          if (item && typeof item === 'object') {
            if (item.product && (typeof item.product === 'string' || !item.product.title)) {
              try {
                const prod = await Product.findById(item.product._id || item.product).populate("seller");
                if (prod) item.product = prod;
              } catch (e) {}
            }
            populatedItems.push(item);
          }
        }
        if (populatedItems.length > 0) order.orderItems = populatedItems;
      }
      orders.push(order);
    }

    return orders;
  }

  async getShopsOrders(sellerId) {
    return await Order.find({ seller: sellerId })
      .sort({ orderDate: -1 })
      .populate([
        { path: "seller" },
        { path: "shippingAddress" },
        { path: "orderItems", populate: { path: "product" } },
      ]);
  }

  async updateOrderStatus(orderId, orderStatus) {
    const order = await this.findOrderById(orderId);

    order.orderStatus = orderStatus;

   
    return await Order.findByIdAndUpdate(orderId, order, {
      new: true,
      runValidators: true,
    }).populate([
      { path: "seller" },
      { path: "shippingAddress" },
      { path: "orderItems", populate: { path: "product" } },
    ]);
  }

  async deleteOrder(orderId) {
    const order = await this.findOrderById(orderId);
    if (!order) {
      throw new OrderError(`Order not found with id ${orderId}`);
    }
    return await Order.deleteOne({ _id: orderId });
  }

  async cancelOrder(orderId, user) {
    const order = await this.findOrderById(orderId);
    if (user._id.toString() !== order.user.toString()) {
      throw new OrderError(
        `You can't perform this action on order id ${orderId}`
      );
    }
    order.orderStatus = OrderStatus.CANCELLED;
    return await Order.findByIdAndUpdate(orderId, order, { new: true });
  }
}

module.exports = new OrderService();
