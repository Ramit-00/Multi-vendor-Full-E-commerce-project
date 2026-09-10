require("dotenv").config();
const crypto = require("crypto");
const ProductService = require("./ProductService");
const ChatSession = require("../models/ChatSession");
const prisma = require("../config/prisma");

class ChatbotService {
  constructor() {
    this.memorySessions = new Map();
  }

  async _getSession(sessionId, userId = null) {
    if (!sessionId) {
      sessionId = 'session_' + crypto.randomBytes(12).toString('hex');
    }

    let session = null;
    try {
      session = await ChatSession.findOne({ sessionId });
      if (!session) {
        session = new ChatSession({
          sessionId,
          userId: userId || null,
          messages: [],
        });
        await session.save();
      }
    } catch (dbErr) {
      // Memory fallback if MongoDB offline
      if (!this.memorySessions.has(sessionId)) {
        this.memorySessions.set(sessionId, {
          sessionId,
          userId: userId || null,
          messages: [],
        });
      }
      session = this.memorySessions.get(sessionId);
    }
    return { session, sessionId };
  }

  async _appendMessage(session, role, text) {
    if (!session || !text) return;
    const msg = { role, text, timestamp: new Date() };

    if (session.messages) {
      session.messages.push(msg);
      // Keep only last 10 messages for context window efficiency
      if (session.messages.length > 10) {
        session.messages = session.messages.slice(-10);
      }
    }

    if (typeof session.save === 'function') {
      try {
        session.updatedAt = new Date();
        await session.save();
      } catch (e) {}
    }
  }

  async _generateContent(ai, contents) {
    const primaryModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const fallbackModel = "gemini-1.5-flash";

    try {
      const response = await ai.models.generateContent({
        model: primaryModel,
        contents,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (primaryErr) {
      console.warn(`[Chatbot] ${primaryModel} failed (${primaryErr.message}), trying fallback ${fallbackModel}...`);
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: fallbackModel,
          contents,
        });
        if (fallbackResponse && fallbackResponse.text) {
          return fallbackResponse.text;
        }
      } catch (fallbackErr) {
        console.error("[Chatbot] Fallback model also failed:", fallbackErr.message);
        throw fallbackErr;
      }
    }
    return "I am here to assist you with your shopping on E-COM. How can I help you today?";
  }

  async _groundWithCatalog(userQuery) {
    const q = (userQuery || '').toLowerCase();
    const productKeywords = [
      'shirt', 't-shirt', 'saree', 'watch', 'phone', 'mobile', 'furniture', 'runner',
      'dress', 'shoe', 'lehenga', 'buy', 'price', 'cost', 'under', 'looking for', 'search',
      'show me', 'recommend', 'deal', 'discount'
    ];

    const hasKeyword = productKeywords.some(kw => q.includes(kw));
    if (!hasKeyword) return '';

    try {
      const results = await ProductService.searchProduct(userQuery);
      const topItems = (results || []).slice(0, 4);

      if (topItems.length === 0) return '';

      const itemsDesc = topItems.map((p, idx) => {
        const title = p.title || p.name || 'Product';
        const price = p.sellingPrice || p.price || 0;
        const mrp = p.mrpPrice || price;
        const discount = p.discountPercent || 0;
        const stock = p.stock || p.stockQuantity || p.quantity || 'In Stock';
        return `${idx + 1}. ${title} - ₹${price} (MRP: ₹${mrp}, ${discount}% OFF) | Stock: ${stock}`;
      }).join('\n');

      return `\n--- LIVE STORE CATALOG MATCHES ---\n${itemsDesc}\n----------------------------------\n`;
    } catch (e) {
      return '';
    }
  }

  async _groundWithOrder(userQuery, userId) {
    const q = (userQuery || '').toLowerCase();
    const orderKeywords = ['order', 'track', 'tracking', 'package', 'courier', 'delivery', 'shipped'];
    const hasKeyword = orderKeywords.some(kw => q.includes(kw));
    if (!hasKeyword) return '';

    try {
      // Look for UUID or recent orders
      let orders = [];
      if (userId) {
        orders = await prisma.order.findMany({
          where: { userId: String(userId) },
          take: 2,
          orderBy: { createdAt: 'desc' },
          include: { orderItems: true, payment: true },
        });
      }

      if (orders.length === 0) return '';

      const ordersDesc = orders.map((o, idx) => {
        const date = new Date(o.createdAt).toLocaleDateString();
        const items = (o.orderItems || []).map(i => i.productName || 'Item').join(', ');
        return `Order #${o.id.slice(0, 8)}: Status: ${o.status} | Total: ₹${o.totalAmount} | Date: ${date} | Items: ${items}`;
      }).join('\n');

      return `\n--- RECENT CUSTOMER ORDERS ---\n${ordersDesc}\n-----------------------------\n`;
    } catch (e) {
      return '';
    }
  }

  async chatService(contentsOrText, options = {}) {
    const { sessionId: incomingSessionId, userId } = options;
    const { session, sessionId } = await this._getSession(incomingSessionId, userId);

    let userText = "";
    if (typeof contentsOrText === "string") {
      userText = contentsOrText;
    } else if (Array.isArray(contentsOrText)) {
      userText = contentsOrText.map(c => (c.parts || []).map(p => p.text).join(" ")).join("\n");
    } else if (contentsOrText && contentsOrText.parts) {
      userText = (contentsOrText.parts || []).map(p => p.text).join(" ");
    } else if (contentsOrText && contentsOrText.message) {
      userText = contentsOrText.message;
    } else if (contentsOrText && contentsOrText.prompt) {
      userText = contentsOrText.prompt;
    }

    userText = userText.trim() || "Hello";
    await this._appendMessage(session, 'user', userText);

    // Live catalog and order grounding
    const catalogGrounding = await this._groundWithCatalog(userText);
    const orderGrounding = await this._groundWithOrder(userText, userId);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      let fallbackReply = "Welcome to E-COM Marketplace! I am your AI assistant.";
      if (catalogGrounding) {
        fallbackReply += ` Here are matching products from our live catalog:\n${catalogGrounding}\nHow else may I assist your shopping today?`;
      } else if (orderGrounding) {
        fallbackReply += ` Here is your order tracking info:\n${orderGrounding}`;
      } else {
        fallbackReply += " You can browse diverse categories including Men's & Women's Fashion, Electronics, Smartwatches, and more. How can I help you today?";
      }
      await this._appendMessage(session, 'model', fallbackReply);
      return { answer: fallbackReply, message: fallbackReply, sessionId };
    }

    try {
      // Build conversation history parts for Gemini
      const conversationHistory = (session.messages || []).slice(0, -1).map(m => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));

      const systemInstruction = `
You are the official AI Shopping Assistant for E-COM, a leading multi-vendor eCommerce marketplace.
Help customers with:
- Product inquiries, recommendations, and feature comparisons
- Orders, shipping, delivery tracking, and payment methods
- Merchant partner information ("Become a Seller" portal)
- Store policies, deals, and discounts

${catalogGrounding}
${orderGrounding}

Provide a helpful, friendly, and concise answer formatted with clean Markdown.
`;

      const prompt = `${systemInstruction}\n\nCustomer query: ${userText}`;

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI(apiKey);

      const contents = [
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ];

      const answer = await this._generateContent(ai, contents);
      await this._appendMessage(session, 'model', answer);
      return { answer, message: answer, sessionId };
    } catch (error) {
      console.error("[Chatbot] General chat error:", error.message);
      const errReply = "Hello! I am your E-COM shopping assistant. I am currently available to help you explore our top deals, discover fashionable apparel, and assist with your shopping journey.";
      await this._appendMessage(session, 'model', errReply);
      return { answer: errReply, message: errReply, sessionId };
    }
  }

  async askProductQuestion(productId, userQuestion, options = {}) {
    const { sessionId: incomingSessionId, userId } = options;
    const { session, sessionId } = await this._getSession(incomingSessionId, userId);

    if (!productId || productId === "undefined" || productId === "null") {
      return await this.chatService(userQuestion, { sessionId, userId });
    }

    let product = null;
    try {
      product = await ProductService.findProductById(productId);
    } catch (lookupErr) {
      console.warn(`[Chatbot] Product lookup note for ID ${productId}:`, lookupErr.message);
    }

    if (!product) {
      return await this.chatService(userQuestion, { sessionId, userId });
    }

    await this._appendMessage(session, 'user', userQuestion);

    const title = product.title || product.name || "Product";
    const sellingPrice = product.sellingPrice || product.price || "N/A";
    const mrpPrice = product.mrpPrice || sellingPrice;
    const discount = product.discountPercent || 0;
    const color = product.color || "Standard";
    const description = product.description || "High quality merchandise.";
    const sizes = Array.isArray(product.sizes) ? product.sizes.join(", ") : (product.sizes || "Standard");
    const category = typeof product.category === "object" ? (product.category?.name || product.category?.categoryId || "General") : (product.category || "General");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallbackReply = `Regarding **${title}**: It is currently listed at ₹${sellingPrice} (MRP: ₹${mrpPrice}, ${discount}% OFF). Color: ${color}. Sizes available: ${sizes}. ${description}`;
      await this._appendMessage(session, 'model', fallbackReply);
      return { answer: fallbackReply, message: fallbackReply, sessionId };
    }

    try {
      const prompt = `
You are the dedicated eCommerce shopping assistant for E-COM.
Answer the customer's question specifically using the product details below.
Be concise, polite, and accurate. Use Markdown for clarity.

--- PRODUCT DETAILS ---
Title: ${title}
Category: ${category}
Selling Price: ₹${sellingPrice} (MRP: ₹${mrpPrice}, Discount: ${discount}% OFF)
Color / Variant: ${color}
Available Sizes: ${sizes}
Description: ${description}
-----------------------

Customer's Question: ${userQuestion}
Answer:
`;

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI(apiKey);

      const contents = [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ];

      const answer = await this._generateContent(ai, contents);
      await this._appendMessage(session, 'model', answer);
      return { answer, message: answer, sessionId };
    } catch (error) {
      console.error("[Chatbot] askProductQuestion error:", error.message);
      return await this.chatService(userQuestion, { sessionId, userId });
    }
  }
}

module.exports = new ChatbotService();
