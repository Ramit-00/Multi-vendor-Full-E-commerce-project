const Product = require("../models/Product");
const Category = require("../models/Category");
const mongoose = require("mongoose");
const ProductError = require("../exceptions/ProductError");

const calculateDiscountPercentage = (mrpPrice, sellingPrice) => {
  if (mrpPrice <= 0) {
    throw new Error("MRP must be greater than zero");
  }
  const discount = mrpPrice - sellingPrice;
  return Math.round((discount / mrpPrice) * 100);
};

class ProductService {
  async createProduct(req, seller) {
    try {
      const discountPercentage = calculateDiscountPercentage(
        req.mrpPrice,
        req.sellingPrice
      );

      const category1 = await this.createOrGetCategory(req.category, 1);
      const category2 = req.category2
        ? await this.createOrGetCategory(req.category2, 2, category1._id)
        : category1;
      const category3 = req.category3
        ? await this.createOrGetCategory(req.category3, 3, category2._id)
        : category2;

      const sellerId = seller._id || seller.id || seller;
      const product = new Product({
        seller: sellerId,
        category: category3._id || category3,
        title: req.title,
        color: req.color || "Standard",
        description: req.description || "",
        discountPercent: discountPercentage || 0,
        sellingPrice: Number(req.sellingPrice),
        images: Array.isArray(req.images) ? req.images : [req.images],
        mrpPrice: Number(req.mrpPrice),
        sizes: req.sizes || "FREE",
        quantity: Number(req.quantity) || 10,
        createdAt: new Date(),
      });

      return await product.save();
    } catch (error) {
      console.log("====== ", error.message);
      throw new ProductError(error.message);
    }
  }

  async createOrGetCategory(categoryId, level, parentId = null) {
    let category = await Category.findOne({ categoryId });
    if (!category) {
      category = new Category({
        categoryId,
        level,
        parentCategory: parentId,
      });
      await category.save();
    }
    return category;
  }

  // Helper to check mongoose connection
  _dbConnected() {
    try {
      return mongoose && mongoose.connection && mongoose.connection.readyState === 1;
    } catch (e) {
      return false;
    }
  }

  async deleteProduct(productId) {
    try {
      const product = await this.findProductById(productId);
      await Product.findByIdAndDelete(product._id);
    } catch (error) {
      throw new ProductError(error.message);
    }
  }

  async updateProduct(productId, updatedProductData) {
    try {
      const product = await Product.findByIdAndUpdate(
        productId,
        { $set: updatedProductData },
        { new: true }
      );
      if (!product) throw new ProductError("Product not found");
      return product;
    } catch (error) {
      throw new ProductError(error.message);
    }
  }

  _getAllCategoryProducts() {
    if (this._cachedCategoryProducts && this._cachedCategoryProducts.length > 0) {
      return this._cachedCategoryProducts;
    }
    const fs = require('fs');
    const path = require('path');
    const baseImagesDir = path.join(__dirname, '..', '..', '..', 'product images');

    const allProducts = [];

    // Helper to safely list files
    const getFiles = (dir) => {
      try {
        if (!fs.existsSync(dir)) return [];
        return fs.readdirSync(dir).filter(f => !f.startsWith('.') && fs.statSync(path.join(dir, f)).isFile());
      } catch (e) {
        return [];
      }
    };

    // 1. Men Shirts ("Men shirt")
    const shirtFiles = getFiles(path.join(baseImagesDir, 'Men shirt'));
    const shirtTitles = [
      "Louis Philippe Tailored Fit Formal Solid Shirt",
      "Louis Philippe Azure Slim Fit Executive Shirt",
      "Louis Philippe Modern Oxford Casual Cotton Shirt",
      "Louis Philippe Premium French Cuff Formal Shirt"
    ];
    shirtFiles.forEach((file, i) => {
      allProducts.push({
        _id: `men_shirt_${i}`,
        id: `men_shirt_${i}`,
        title: shirtTitles[i] || `Louis Philippe Men Shirt ${i + 1}`,
        sellingPrice: 1499 + (i * 200),
        mrpPrice: 2499 + (i * 200),
        discountPercent: 40,
        images: [`Men shirt/${file}`],
        categories: ["men", "men_topwear", "men_casual_shirts", "men_formal_shirts", "men_shirts", "shirts"],
        folder: "Men shirt",
        color: i % 2 === 0 ? "White" : "Blue",
        sizes: ["M", "L", "XL"],
        stock: 20,
        description: "Pure combed cotton shirt with tailored collar, breathable weave, and signature Louis Philippe detailing. Perfect for business meetings and evening gatherings.",
        seller: { businessDetails: { businessName: "Louis Philippe Official" } },
        createdAt: new Date()
      });
    });

    // 2. Men T-Shirts ("men tshirt")
    const tshirtFiles = getFiles(path.join(baseImagesDir, 'men tshirt'));
    const tshirtTitles = [
      "Urban Active Crew Neck Bio-Washed T-Shirt",
      "Graphic Streetwear Slim Fit Cotton T-Shirt",
      "Essential Athletic Stretch Breathable T-Shirt"
    ];
    tshirtFiles.forEach((file, i) => {
      allProducts.push({
        _id: `men_tshirt_${i}`,
        id: `men_tshirt_${i}`,
        title: tshirtTitles[i] || `Urban Men T-Shirt ${i + 1}`,
        sellingPrice: 599 + (i * 100),
        mrpPrice: 999 + (i * 100),
        discountPercent: 40,
        images: [`men tshirt/${file}`],
        categories: ["men", "men_topwear", "men_t_shirts", "t_shirts", "tshirts"],
        folder: "men tshirt",
        color: i === 0 ? "Black" : i === 1 ? "Navy" : "Olive",
        sizes: ["S", "M", "L", "XL"],
        stock: 35,
        description: "100% premium pre-shrunk cotton t-shirt with reinforced crew neck and soft bio-wash finish for all-day comfort.",
        seller: { businessDetails: { businessName: "Urban Threads Co." } },
        createdAt: new Date()
      });
    });

    // 3. Home & Furniture ("furniture")
    const furnitureFiles = getFiles(path.join(baseImagesDir, 'furniture'));
    const runnerTitles = [
      "Handwoven Bohemian Dining & Bed Runner",
      "Artisan Geometric Jacquard Table Runner",
      "Vintage Embroidered Velvet Accent Runner"
    ];
    furnitureFiles.forEach((file, i) => {
      allProducts.push({
        _id: `furniture_${i}`,
        id: `furniture_${i}`,
        title: runnerTitles[i] || `Artisan Home Runner ${i + 1}`,
        sellingPrice: 799 + (i * 200),
        mrpPrice: 1399 + (i * 200),
        discountPercent: 43,
        images: [`furniture/${file}`],
        categories: ["home_furniture", "furniture", "bed_runners", "home_decor", "living_room"],
        folder: "furniture",
        color: "Multicolor",
        sizes: ["FREE"],
        stock: 15,
        description: "Elegantly textured luxury runner crafted with premium woven fabric. Adds a warm, sophisticated aesthetic to dining tables and bed ends.",
        seller: { businessDetails: { businessName: "Casa Décor Studio" } },
        createdAt: new Date()
      });
    });

    // 4. Mobile Phones ("mobile")
    const mobileFiles = getFiles(path.join(baseImagesDir, 'mobile'));
    const mobileTitles = [
      "NextGen Galaxy Ultra 5G (Phantom Black, 256GB)",
      "Pro Max 5G AMOLED Flagship (Starlight, 128GB)",
      "Edge Dynamic 5G Curved Screen (8GB RAM, 128GB)",
      "Sonic Speed 5G Gaming Smartphone (12GB RAM)",
      "Starlight Slim 5G Quad Camera Smartphone",
      "Apex Prime 5G 120Hz Ultra Smooth Phone",
      "Nova Z 5G AI Dual Camera High-Capacity Phone",
      "Infinity Pro 5G Gorilla Glass Smartphone",
      "Horizon 5G Super Retina Display (256GB)",
      "Cyber Neo 5G High-Performance Phone"
    ];
    mobileFiles.forEach((file, i) => {
      allProducts.push({
        _id: `mobile_${i}`,
        id: `mobile_${i}`,
        title: mobileTitles[i] || `Flagship 5G Smartphone ${i + 1}`,
        sellingPrice: 16999 + (i * 2500),
        mrpPrice: 24999 + (i * 2500),
        discountPercent: 32,
        images: [`mobile/${file}`],
        categories: ["electronics", "mobiles", "smartphones", "gadgets", "accessories"],
        folder: "mobile",
        color: i % 2 === 0 ? "Black" : "Blue",
        sizes: ["128GB", "256GB"],
        stock: 12,
        description: "Powered by an octa-core 5G processor, vibrant 120Hz AMOLED screen, multi-lens AI camera array, and 5000mAh battery with fast charging.",
        seller: { businessDetails: { businessName: "TechHub Mobiles" } },
        createdAt: new Date()
      });
    });

    // 5. Smart Watches & Watches ("watch" & subdirs)
    const watchDir = path.join(baseImagesDir, 'watch');
    const watchRootFiles = getFiles(watchDir);
    const watchSubdirs = ['boalt', 'watch 2', 'watch 3', 'watch 4'];
    const watchFiles = [...watchRootFiles.map(f => `watch/${f}`)];
    watchSubdirs.forEach(sd => {
      const sFiles = getFiles(path.join(watchDir, sd));
      sFiles.forEach(sf => watchFiles.push(`watch/${sd}/${sf}`));
    });

    const watchTitles = [
      "Titan Smart Touch Bluetooth Calling Watch",
      "Titan Edge Classic Sapphire Chronograph",
      "Titan Active Fitness Sport Smartwatch",
      "Cellecor Pro Ray AMOLED Display Smartwatch",
      "Cellecor Active Heart Rate & SpO2 Tracker",
      "Cellecor Rugged Outdoor GPS Smartwatch",
      "BoAt Wave Voice HD Bluetooth Smartwatch",
      "BoAt Flash Touch Waterproof Fitness Watch",
      "Aero Pulse Stainless Steel Smart Band",
      "Kronos Precision Multi-Dial Luxury Watch"
    ];

    watchFiles.slice(0, 10).forEach((imgPath, i) => {
      allProducts.push({
        _id: `watch_${i}`,
        id: `watch_${i}`,
        title: watchTitles[i] || `Luxury Smart Watch ${i + 1}`,
        sellingPrice: 2499 + (i * 600),
        mrpPrice: 4999 + (i * 600),
        discountPercent: 50,
        images: [imgPath],
        categories: ["electronics", "smart_watches", "watches", "men_watches", "women_watches", "gadgets"],
        folder: "watch",
        color: i % 2 === 0 ? "Black" : "Silver",
        sizes: ["FREE"],
        stock: 25,
        description: "HD color touchscreen with Bluetooth calling, 100+ sports modes, 24/7 health tracking, sleep monitor, and up to 7-day battery life.",
        seller: { businessDetails: { businessName: "Chronos Timepiece & Co." } },
        createdAt: new Date()
      });
    });

    // 6. Shop For Wedding ("shop for wedding")
    const weddingFiles = getFiles(path.join(baseImagesDir, 'shop for wedding'));
    const weddingTitles = [
      "House of Pataudi Handcrafted Embellished Wedges",
      "Royal Heritage Zari Embroidered Wedding Dupatta",
      "House of Pataudi Men Tan Leather Formal Wedding Loafers",
      "Handcrafted Zari Bridal Embroidered Lehenga Choli",
      "Festive Gold Zari Velvet Sherwani Stole",
      "Regal Traditional Heritage Bridal Ensemble"
    ];
    weddingFiles.forEach((file, i) => {
      const isMenLoafer = file.toLowerCase().includes('men') || file.toLowerCase().includes('loafers');
      const cats = isMenLoafer
        ? ["shop_for_wedding", "wedding", "men_footwear", "men", "footwear"]
        : ["shop_for_wedding", "wedding", "women_indian_and_fusion_wear", "women_lehenga_cholis", "women"];

      allProducts.push({
        _id: `wedding_${i}`,
        id: `wedding_${i}`,
        title: weddingTitles[i] || `Royal Wedding Collection ${i + 1}`,
        sellingPrice: 2499 + (i * 800),
        mrpPrice: 4999 + (i * 800),
        discountPercent: 50,
        images: [`shop for wedding/${file}`],
        categories: cats,
        folder: "shop for wedding",
        color: isMenLoafer ? "Tan" : "Maroon",
        sizes: isMenLoafer ? ["8", "9", "10"] : ["FREE"],
        stock: 10,
        description: "Bespoke festive craftsmanship featuring intricate zari work, rich textiles, and regal detailing suited for traditional weddings and celebrations.",
        seller: { businessDetails: { businessName: "Royal Heritage Wedding" } },
        createdAt: new Date()
      });
    });

    // 7. Sarees ("products")
    const sareeFiles = getFiles(path.join(baseImagesDir, 'products'));
    sareeFiles.slice(0, 30).forEach((file, i) => {
      const rawName = file.replace(/\.[^.]+$/, '').replace(/^[a-f0-9-]{36}/i, '');
      const cleanTitle = (rawName.replace(/[-_]/g, ' ').trim() || `Designer Saree Collection ${i + 1}`)
        .replace(/\b\w/g, c => c.toUpperCase());

      allProducts.push({
        _id: `saree_${i}`,
        id: `saree_${i}`,
        title: cleanTitle,
        sellingPrice: 899 + (i * 120),
        mrpPrice: Math.round((899 + (i * 120)) * 1.45),
        discountPercent: 31,
        images: [`products/${file}`],
        categories: ["women", "women_indian_and_fusion_wear", "sarees", "ethnic_wear"],
        folder: "products",
        color: i % 4 === 0 ? 'Blue' : i % 4 === 1 ? 'Red' : i % 4 === 2 ? 'Green' : 'Gold',
        sizes: ['FREE'],
        stock: 25,
        description: "Exquisite traditional handloom saree crafted with lustrous zari borders and detailed pallu. Includes matching unstitched blouse piece.",
        seller: { businessDetails: { businessName: "Heritage Ethnic Studio" } },
        createdAt: new Date()
      });
    });

    this._cachedCategoryProducts = allProducts;
    return allProducts;
  }

  _filterProductsByCategory(products, category) {
    if (!category || category === 'all') return products;
    const cat = category.toLowerCase().trim();

    return products.filter(p => {
      // Direct category tag match
      if (p.categories && p.categories.some(c => c.toLowerCase() === cat)) return true;

      // Subcategory & keyword rules
      if (cat.includes('t_shirt') || cat.includes('tshirt')) {
        return p.folder === 'men tshirt';
      }
      if (cat.includes('shirt') && !cat.includes('t_shirt') && !cat.includes('tshirt')) {
        return p.folder === 'Men shirt';
      }
      if (cat === 'men' || cat === 'men_topwear') {
        return p.folder === 'Men shirt' || p.folder === 'men tshirt' || (p.folder === 'shop for wedding' && p.categories.includes('men'));
      }
      if (cat.includes('mobile') || cat.includes('smartphone') || cat.includes('cellphone') || cat === 'phone' || cat === 'phones') {
        return p.folder === 'mobile';
      }
      if (cat.includes('smart_watch') || cat === 'watch' || cat === 'watches' || cat.includes('wrist_watch')) {
        return p.folder === 'watch';
      }
      if (cat === 'electronics' || cat === 'gadgets') {
        return p.folder === 'mobile' || p.folder === 'watch';
      }
      if (cat.includes('furniture') || cat.includes('runner') || cat.includes('decor') || cat === 'home_furniture') {
        return p.folder === 'furniture';
      }
      if (cat.includes('wedding') || cat === 'shop_for_wedding') {
        return p.folder === 'shop for wedding';
      }
      if (cat === 'women' || cat.includes('saree') || cat.includes('ethnic') || cat.includes('fusion') || cat.includes('lehenga')) {
        return p.folder === 'products' || (p.folder === 'shop for wedding' && p.categories.includes('women'));
      }

      // Fallback: title search
      return p.title.toLowerCase().includes(cat);
    });
  }

  _getSampleProducts(categoryFilter) {
    const all = this._getAllCategoryProducts();
    if (!categoryFilter || categoryFilter === 'all') {
      return all;
    }
    return this._filterProductsByCategory(all, categoryFilter);
  }

  async findProductById(productId) {
    const samples = this._getAllCategoryProducts();
    const match = samples.find(p => p._id === productId || p.id === productId);
    if (match) return match;

    try {
      if (!this._dbConnected()) {
        throw new ProductError('Product not found');
      }
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ProductError("Invalid product ID...");
      }
      const product = await Product.findById(productId).populate("seller");
      if (!product) throw new ProductError("Product not found");
      return product;
    } catch (error) {
      if (match) return match;
      throw new ProductError(error.message);
    }
  }

  async searchProduct(query) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return [];
    }

    const rawQuery = query.trim();
    const cleanQuery = rawQuery.toLowerCase();
    const queryTokens = cleanQuery
      .split(/[\s,_\-+]+/)
      .filter(t => t.length > 0 && !['a', 'an', 'the', 'in', 'on', 'of', 'for', 'with', 'and'].includes(t));

    // Helper matcher for in-memory / sample products
    const matchSampleProduct = (p) => {
      const title = (p.title || '').toLowerCase();
      const description = (p.description || '').toLowerCase();
      const color = (p.color || '').toLowerCase();
      const folder = (p.folder || '').toLowerCase();
      const categories = Array.isArray(p.categories) ? p.categories.map(c => String(c).toLowerCase()) : [];
      const sellerBusiness = (p.seller?.businessDetails?.businessName || '').toLowerCase();
      const sellerName = (p.seller?.sellerName || '').toLowerCase();

      // Combined searchable text corpus
      const combined = `${title} ${description} ${color} ${folder} ${categories.join(' ')} ${sellerBusiness} ${sellerName}`;

      // 1. Direct full query phrase match
      if (combined.includes(cleanQuery)) {
        return true;
      }

      // 2. Token / word matching
      if (queryTokens.length > 0) {
        const allTokensMatch = queryTokens.every(token => {
          if (combined.includes(token)) return true;
          // Handle plural / singular stems
          if (token.endsWith('es') && combined.includes(token.slice(0, -2))) return true;
          if (token.endsWith('s') && combined.includes(token.slice(0, -1))) return true;
          if (combined.includes(token + 's') || combined.includes(token + 'es')) return true;
          return false;
        });

        if (allTokensMatch) return true;

        if (queryTokens.length >= 2) {
          const matchedCount = queryTokens.filter(token => {
            if (combined.includes(token)) return true;
            if (token.endsWith('es') && combined.includes(token.slice(0, -2))) return true;
            if (token.endsWith('s') && combined.includes(token.slice(0, -1))) return true;
            return false;
          }).length;
          if (matchedCount / queryTokens.length >= 0.6) return true;
        }
      }

      return false;
    };

    let sampleMatches = [];
    try {
      const samples = this._getAllCategoryProducts();
      sampleMatches = samples.filter(matchSampleProduct);
    } catch (sampleErr) {
      console.warn("Error filtering sample products:", sampleErr.message);
    }

    let dbMatches = [];
    if (this._dbConnected()) {
      try {
        const Seller = require("../models/Seller");
        const Category = require("../models/Category");

        const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const tokenRegexes = queryTokens.map(t => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));

        // Find matching categories
        const matchingCategories = await Category.find({
          $or: [
            { name: new RegExp(escaped, 'i') },
            { categoryId: new RegExp(escaped, 'i') },
            ...tokenRegexes.map(r => ({ name: r })),
            ...tokenRegexes.map(r => ({ categoryId: r }))
          ]
        }).select('_id');
        const categoryIds = matchingCategories.map(c => c._id);

        // Find matching sellers
        const matchingSellers = await Seller.find({
          $or: [
            { sellerName: new RegExp(escaped, 'i') },
            { "businessDetails.businessName": new RegExp(escaped, 'i') },
            ...tokenRegexes.map(r => ({ sellerName: r })),
            ...tokenRegexes.map(r => ({ "businessDetails.businessName": r }))
          ]
        }).select('_id');
        const sellerIds = matchingSellers.map(s => s._id);

        const orConditions = [
          { title: new RegExp(escaped, 'i') },
          { description: new RegExp(escaped, 'i') },
          { color: new RegExp(escaped, 'i') }
        ];

        if (categoryIds.length > 0) {
          orConditions.push({ category: { $in: categoryIds } });
        }
        if (sellerIds.length > 0) {
          orConditions.push({ seller: { $in: sellerIds } });
        }

        tokenRegexes.forEach(r => {
          orConditions.push({ title: r });
          orConditions.push({ description: r });
        });

        dbMatches = await Product.find({ $or: orConditions })
          .populate("seller")
          .populate("category");
      } catch (dbErr) {
        console.warn("Error querying MongoDB for search:", dbErr.message);
      }
    }

    // Merge and deduplicate
    const seenIds = new Set();
    const seenTitles = new Set();
    const combinedResults = [];

    [...dbMatches, ...sampleMatches].forEach(item => {
      const id = String(item._id || item.id || '');
      const title = (item.title || '').trim().toLowerCase();

      if (id && seenIds.has(id)) return;
      if (title && seenTitles.has(title)) return;

      if (id) seenIds.add(id);
      if (title) seenTitles.add(title);
      combinedResults.push(item);
    });

    return combinedResults;
  }

  async getAllProducts(req) {
    const requestedCategory = req.category || '';

    if (this._dbConnected()) {
      try {
        const filterQuery = {};
        if (requestedCategory && requestedCategory !== 'all') {
          const category = await Category.findOne({ categoryId: requestedCategory });
          if (category) {
            const categoryIds = [category._id];
            let parentIds = [category._id];
            while (parentIds.length > 0) {
              const children = await Category.find({ parentCategory: { $in: parentIds } }).select('_id');
              parentIds = children.map((child) => child._id);
              categoryIds.push(...parentIds);
            }
            filterQuery.category = { $in: categoryIds };
          } else {
            // Category not registered in DB collection - ensure DB query matches 0 products
            filterQuery.category = new mongoose.Types.ObjectId();
          }
        }

        if (req.color) filterQuery.color = req.color;
        if (req.size) filterQuery.size = req.size;
        if (req.minPrice) filterQuery.sellingPrice = { $gte: req.minPrice };
        if (req.maxPrice) filterQuery.sellingPrice = { ...filterQuery.sellingPrice, $lte: req.maxPrice };
        if (req.minDiscount) filterQuery.discountPercent = { $gte: req.minDiscount };
        if (req.stock) filterQuery.stock = req.stock;

        let sortQuery = {};
        if (req.sort === "price_low") sortQuery.sellingPrice = 1;
        else if (req.sort === "price_high") sortQuery.sellingPrice = -1;

        const products = await Product.find(filterQuery)
          .sort(sortQuery)
          .skip((req.pageNumber || 0) * 10)
          .limit(10);

        const totalElements = await Product.countDocuments(filterQuery);
        const pageSize = parseInt(req.pageSize) || 10;
        const totalPages = Math.ceil(totalElements / pageSize);

        if (products.length > 0) {
          return { content: products, totalPages, totalElements };
        }
      } catch (dbErr) {
        console.warn("DB query error in getAllProducts, using category mock:", dbErr.message);
      }
    }

    // Category-Aware Products from local images
    let samples = this._getSampleProducts(requestedCategory);

    // If a specific category was requested and has 0 products available, return empty immediately
    if (requestedCategory && requestedCategory !== 'all' && samples.length === 0) {
      return {
        content: [],
        totalPages: 0,
        totalElements: 0,
      };
    }

    // Apply color filter
    if (req.color) {
      samples = samples.filter(p => (p.color || '').toLowerCase() === req.color.toLowerCase());
    }
    // Apply price filter
    if (req.minPrice) {
      samples = samples.filter(p => p.sellingPrice >= req.minPrice);
    }
    if (req.maxPrice) {
      samples = samples.filter(p => p.sellingPrice <= req.maxPrice);
    }
    // Apply discount filter
    if (req.minDiscount) {
      samples = samples.filter(p => (p.discountPercent || 0) >= req.minDiscount);
    }
    // Apply sort
    if (req.sort === 'price_low') {
      samples.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (req.sort === 'price_high') {
      samples.sort((a, b) => b.sellingPrice - a.sellingPrice);
    }

    if (samples.length === 0) {
      return {
        content: [],
        totalPages: 0,
        totalElements: 0,
      };
    }

    const pageSize = parseInt(req.pageSize) || 20;
    const pageNumber = parseInt(req.pageNumber) || 0;
    const paginated = samples.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize);

    return {
      content: paginated,
      totalPages: Math.ceil(samples.length / pageSize) || 1,
      totalElements: samples.length,
    };
  }

  async recentlyAddedProduct() {
    if (!this._dbConnected()) return [];
    return await Product.find().sort({ createdAt: -1 }).limit(10);
  }

  async getProductBySellerId(sellerId) {
    if (!this._dbConnected()) return [];
    return await Product.find({ seller: sellerId });
  }
}

module.exports = new ProductService();
