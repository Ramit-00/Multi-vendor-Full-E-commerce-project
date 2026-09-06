require("dotenv").config();
const fs = require("fs");
const ProductService = require("./ProductService");

class ChatboatService {
  async _generateContent(ai, contents) {
    const primaryModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const fallbackModel = "gemini-flash-latest";

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

  async chatService(contentsOrText) {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return "Welcome to E-COM Marketplace! I am your AI assistant. You can browse our diverse categories including Men's & Women's Fashion, Electronics, Smartwatches, and more. How can I assist you today?";
      }

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

      const prompt = `
You are the official AI Shopping Assistant for E-COM, a leading multi-vendor eCommerce marketplace.
Help customers with:
- Product inquiries, recommendations, and feature comparisons
- Orders, shipping, delivery tracking, and payment methods (Cards, Net Banking, UPI, Cash on Delivery)
- Merchant partner information ("Become a Seller" portal)
- Store policies, deals, and discounts

Customer query: ${userText || "Hello"}
Provide a helpful, friendly, and concise answer formatted with clean Markdown.
`;

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI(apiKey);

      const contents = [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ];

      return await this._generateContent(ai, contents);
    } catch (error) {
      console.error("[Chatbot] General chat error:", error.message);
      return "Hello! I am your E-COM shopping assistant. I am currently available to help you explore our top deals, discover fashionable apparel, and assist with your shopping journey.";
    }
  }

  async askProductQuestion(productId, userQuestion) {
    try {
      // If productId is invalid or omitted, gracefully treat as general inquiry
      if (!productId || productId === "undefined" || productId === "null") {
        return await this.chatService(userQuestion);
      }

      let product = null;
      try {
        product = await ProductService.findProductById(productId);
      } catch (lookupErr) {
        console.warn(`[Chatbot] Product lookup note for ID ${productId}:`, lookupErr.message);
      }

      // If product not found, provide general assistance instead of crashing
      if (!product) {
        return await this.chatService(userQuestion);
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return `Regarding **${product.title || "this product"}**: It is listed at ₹${product.sellingPrice || product.mrpPrice || 0} (${product.discountPercent || 0}% OFF). ${product.description || ""}`;
      }

      const title = product.title || "Product";
      const sellingPrice = product.sellingPrice || product.mrpPrice || "N/A";
      const mrpPrice = product.mrpPrice || "N/A";
      const discount = product.discountPercent || 0;
      const color = product.color || "Standard";
      const description = product.description || "High quality merchandise.";
      const sizes = Array.isArray(product.sizes) ? product.sizes.join(", ") : (product.sizes || "Standard");
      const category = typeof product.category === "object" ? (product.category?.name || product.category?.categoryId || "General") : (product.category || "General");

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

      return await this._generateContent(ai, contents);
    } catch (error) {
      console.error("[Chatbot] askProductQuestion error:", error.message);
      return await this.chatService(userQuestion);
    }
  }
}

module.exports = new ChatboatService();
