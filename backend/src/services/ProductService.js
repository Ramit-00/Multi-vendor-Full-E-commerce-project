const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const prisma = require('../config/prisma');
const ProductDetails = require('../models/ProductDetails');
const Category = require('../models/Category');
const ProductError = require('../exceptions/ProductError');

const calculateDiscountPercentage = (mrpPrice, sellingPrice) => {
  if (mrpPrice <= 0) {
    return 0;
  }
  const discount = mrpPrice - sellingPrice;
  return Math.max(0, Math.round((discount / mrpPrice) * 100));
};

class ProductService {
  constructor() {
    this._cachedCategoryProducts = null;
  }

  _dbConnected() {
    try {
      return mongoose && mongoose.connection && mongoose.connection.readyState === 1;
    } catch (e) {
      return false;
    }
  }

  _formatFullProduct(core, details, category = null) {
    if (!core) return null;

    const attributes = details?.attributes || {};
    const seller = core.seller || {};
    const sellerUser = seller.user || {};
    const sellerPayout = (seller.payoutAccountInfo && typeof seller.payoutAccountInfo === 'object')
      ? seller.payoutAccountInfo
      : {};

    const formattedSeller = {
      id: seller.id || core.sellerId,
      _id: seller.id || core.sellerId,
      sellerName: seller.storeName || 'Partner Seller',
      storeName: seller.storeName || 'Partner Seller',
      email: sellerUser.email || '',
      mobile: sellerUser.phone || '',
      businessDetails: sellerPayout.businessDetails || { businessName: seller.storeName || 'Partner Seller' },
    };

    const mrpPrice = Number(attributes.mrpPrice) || Number(core.price);
    const sellingPrice = Number(core.price);
    const discountPercent = attributes.discountPercent !== undefined
      ? Number(attributes.discountPercent)
      : calculateDiscountPercentage(mrpPrice, sellingPrice);

    return {
      id: core.id,
      _id: core.id,
      productId: core.id,
      title: core.name,
      name: core.name,
      description: details?.description || '',
      sku: core.sku,
      price: sellingPrice,
      sellingPrice: sellingPrice,
      mrpPrice: mrpPrice,
      discountPercent: discountPercent,
      quantity: core.stockQuantity,
      stock: core.stockQuantity,
      status: core.status,
      color: attributes.color || 'Standard',
      sizes: attributes.sizes || 'FREE',
      images: details?.images || [],
      category: category || core.categoryId,
      seller: formattedSeller,
      mongoDetailsId: core.mongoDetailsId || (details?._id ? details._id.toString() : null),
      createdAt: core.createdAt,
      updatedAt: core.updatedAt,
      toObject: function() { return { ...this }; },
    };
  }

  async createProduct(req, seller) {
    try {
      const discountPercentage = calculateDiscountPercentage(
        Number(req.mrpPrice) || 0,
        Number(req.sellingPrice) || 0
      );

      const category1 = await this.createOrGetCategory(req.category, 1);
      const category2 = req.category2
        ? await this.createOrGetCategory(req.category2, 2, category1._id)
        : category1;
      const category3 = req.category3
        ? await this.createOrGetCategory(req.category3, 3, category2._id)
        : category2;

      const sellerId = seller?.id || seller?._id || seller;
      const sku = req.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const stockQuantity = Number(req.quantity) || 10;
      const price = Number(req.sellingPrice) || Number(req.mrpPrice) || 0;

      // 1. Create core product in PostgreSQL
      const coreProduct = await prisma.product.create({
        data: {
          sellerId: String(sellerId),
          categoryId: String(category3._id || category3.categoryId || category3),
          sku,
          name: req.title,
          price,
          stockQuantity,
          status: stockQuantity > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
        },
        include: {
          seller: { include: { user: true } },
        },
      });

      // 2. Create flexible details in MongoDB ProductDetails
      let details;
      try {
        details = await ProductDetails.create({
          productId: coreProduct.id,
          description: req.description || '',
          images: Array.isArray(req.images) ? req.images : (req.images ? [req.images] : []),
          attributes: {
            color: req.color || 'Standard',
            sizes: typeof req.sizes === 'string' ? req.sizes : (Array.isArray(req.sizes) ? req.sizes.join(',') : 'FREE'),
            discountPercent: discountPercentage,
            mrpPrice: Number(req.mrpPrice) || price,
          },
        });

        // Update Postgres with mongoDetailsId
        await prisma.product.update({
          where: { id: coreProduct.id },
          data: { mongoDetailsId: details._id.toString() },
        });
      } catch (mongoErr) {
        // Compensating transaction / rollback Postgres
        await prisma.product.delete({ where: { id: coreProduct.id } });
        throw new ProductError(`Failed to save product details: ${mongoErr.message}`);
      }

      return this._formatFullProduct(coreProduct, details, category3);
    } catch (error) {
      console.error('[ProductService] createProduct error:', error.message);
      throw new ProductError(error.message);
    }
  }

  async createOrGetCategory(categoryId, level, parentId = null) {
    if (!categoryId) return { _id: 'cat_default', categoryId: 'general', level: 1 };
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

  async findProductById(productId) {
    const samples = this._getAllCategoryProducts();
    const match = samples.find(p => p._id === productId || p.id === productId);
    if (match) return match;

    try {
      // 1. Search PostgreSQL by UUID, sku, or mongoDetailsId
      let core = await prisma.product.findFirst({
        where: {
          OR: [
            { id: String(productId) },
            { sku: String(productId) },
            { mongoDetailsId: String(productId) },
          ],
        },
        include: {
          seller: { include: { user: true } },
        },
      });

      if (core) {
        let details = null;
        try {
          details = await ProductDetails.findOne({
            $or: [
              { productId: core.id },
              ...(core.mongoDetailsId ? [{ _id: core.mongoDetailsId }] : []),
            ],
          });
        } catch (e) {}

        let category = null;
        if (core.categoryId) {
          try {
            category = await Category.findById(core.categoryId);
          } catch (e) {}
        }

        return this._formatFullProduct(core, details, category);
      }
    } catch (err) {
      console.warn('[ProductService] findProductById DB notice:', err.message);
    }

    if (match) return match;
    throw new ProductError('Product not found');
  }

  async updateProduct(productId, updatedProductData) {
    try {
      const core = await prisma.product.findFirst({
        where: {
          OR: [
            { id: String(productId) },
            { sku: String(productId) },
            { mongoDetailsId: String(productId) },
          ],
        },
      });

      if (!core) {
        throw new ProductError('Product not found');
      }

      const coreUpdates = {};
      if (updatedProductData.title || updatedProductData.name) {
        coreUpdates.name = updatedProductData.title || updatedProductData.name;
      }
      if (updatedProductData.sellingPrice !== undefined) {
        coreUpdates.price = Number(updatedProductData.sellingPrice);
      } else if (updatedProductData.price !== undefined) {
        coreUpdates.price = Number(updatedProductData.price);
      }
      if (updatedProductData.quantity !== undefined) {
        coreUpdates.stockQuantity = Number(updatedProductData.quantity);
        coreUpdates.status = coreUpdates.stockQuantity > 0 ? 'ACTIVE' : 'OUT_OF_STOCK';
      }
      if (updatedProductData.status) {
        coreUpdates.status = updatedProductData.status;
      }

      const updatedCore = await prisma.product.update({
        where: { id: core.id },
        data: coreUpdates,
        include: { seller: { include: { user: true } } },
      });

      // Update Mongo ProductDetails
      let details = await ProductDetails.findOne({
        $or: [{ productId: core.id }, ...(core.mongoDetailsId ? [{ _id: core.mongoDetailsId }] : [])],
      });

      if (details) {
        if (updatedProductData.description !== undefined) details.description = updatedProductData.description;
        if (updatedProductData.images !== undefined) details.images = Array.isArray(updatedProductData.images) ? updatedProductData.images : [updatedProductData.images];
        if (updatedProductData.color) details.attributes.color = updatedProductData.color;
        if (updatedProductData.sizes) details.attributes.sizes = updatedProductData.sizes;
        if (updatedProductData.mrpPrice !== undefined) details.attributes.mrpPrice = Number(updatedProductData.mrpPrice);
        if (updatedProductData.discountPercent !== undefined) details.attributes.discountPercent = Number(updatedProductData.discountPercent);
        await details.save();
      }

      return this._formatFullProduct(updatedCore, details);
    } catch (error) {
      throw new ProductError(error.message);
    }
  }

  async deleteProduct(productId) {
    try {
      const core = await prisma.product.findFirst({
        where: {
          OR: [
            { id: String(productId) },
            { sku: String(productId) },
            { mongoDetailsId: String(productId) },
          ],
        },
      });

      if (core) {
        await prisma.product.delete({ where: { id: core.id } });
        try {
          await ProductDetails.deleteMany({
            $or: [{ productId: core.id }, ...(core.mongoDetailsId ? [{ _id: core.mongoDetailsId }] : [])],
          });
        } catch (e) {}
      }
    } catch (error) {
      throw new ProductError(error.message);
    }
  }

  async getProductBySellerId(sellerId) {
    try {
      const coreProducts = await prisma.product.findMany({
        where: { sellerId: String(sellerId) },
        include: { seller: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
      });

      const productIds = coreProducts.map(p => p.id);
      const detailsList = await ProductDetails.find({ productId: { $in: productIds } });
      const detailsMap = new Map(detailsList.map(d => [d.productId, d]));

      return coreProducts.map(p => this._formatFullProduct(p, detailsMap.get(p.id)));
    } catch (e) {
      console.warn('[ProductService] getProductBySellerId notice:', e.message);
      return [];
    }
  }

  async recentlyAddedProduct() {
    try {
      const coreProducts = await prisma.product.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { seller: { include: { user: true } } },
      });

      const productIds = coreProducts.map(p => p.id);
      const detailsList = await ProductDetails.find({ productId: { $in: productIds } });
      const detailsMap = new Map(detailsList.map(d => [d.productId, d]));

      return coreProducts.map(p => this._formatFullProduct(p, detailsMap.get(p.id)));
    } catch (e) {
      console.warn('[ProductService] recentlyAddedProduct notice:', e.message);
      return [];
    }
  }

  async getAllProducts(req = {}) {
    const requestedCategory = req.category || '';
    let dbProducts = [];
    let totalElements = 0;

    try {
      const where = {};
      if (req.minPrice) where.price = { ...(where.price || {}), gte: Number(req.minPrice) };
      if (req.maxPrice) where.price = { ...(where.price || {}), lte: Number(req.maxPrice) };
      if (req.stock) where.stockQuantity = { gte: Number(req.stock) };

      let orderBy = { createdAt: 'desc' };
      if (req.sort === 'price_low') orderBy = { price: 'asc' };
      else if (req.sort === 'price_high') orderBy = { price: 'desc' };

      const pageSize = parseInt(req.pageSize) || 20;
      const pageNumber = parseInt(req.pageNumber) || 0;

      const [cores, count] = await Promise.all([
        prisma.product.findMany({
          where,
          include: { seller: { include: { user: true } } },
          orderBy,
          skip: pageNumber * pageSize,
          take: pageSize,
        }),
        prisma.product.count({ where }),
      ]);

      const productIds = cores.map(p => p.id);
      const detailsList = await ProductDetails.find({ productId: { $in: productIds } });
      const detailsMap = new Map(detailsList.map(d => [d.productId, d]));

      dbProducts = cores.map(p => this._formatFullProduct(p, detailsMap.get(p.id)));
      totalElements = count;
    } catch (dbErr) {
      console.warn('[ProductService] getAllProducts DB notice:', dbErr.message);
    }

    // Combine with samples
    let samples = this._getSampleProducts(requestedCategory);

    if (req.color) {
      samples = samples.filter(p => (p.color || '').toLowerCase() === req.color.toLowerCase());
      dbProducts = dbProducts.filter(p => (p.color || '').toLowerCase() === req.color.toLowerCase());
    }
    if (req.minPrice) {
      samples = samples.filter(p => p.sellingPrice >= req.minPrice);
    }
    if (req.maxPrice) {
      samples = samples.filter(p => p.sellingPrice <= req.maxPrice);
    }

    // Merge and deduplicate
    const combined = [];
    const seen = new Set();
    [...dbProducts, ...samples].forEach(item => {
      const id = String(item.id || item._id);
      if (!seen.has(id)) {
        seen.add(id);
        combined.push(item);
      }
    });

    const pageSize = parseInt(req.pageSize) || 20;
    const pageNumber = parseInt(req.pageNumber) || 0;
    const paginated = combined.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize);

    return {
      content: paginated,
      totalPages: Math.ceil(combined.length / pageSize) || 1,
      totalElements: combined.length,
    };
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

    // 1. Search Postgres core
    let dbMatches = [];
    try {
      const cores = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: cleanQuery, mode: 'insensitive' } },
            { sku: { contains: cleanQuery, mode: 'insensitive' } },
            ...queryTokens.map(tok => ({ name: { contains: tok, mode: 'insensitive' } })),
          ],
        },
        include: { seller: { include: { user: true } } },
      });

      const productIds = cores.map(p => p.id);
      const detailsList = await ProductDetails.find({ productId: { $in: productIds } });
      const detailsMap = new Map(detailsList.map(d => [d.productId, d]));

      dbMatches = cores.map(p => this._formatFullProduct(p, detailsMap.get(p.id)));
    } catch (e) {
      console.warn('[ProductService] searchProduct DB notice:', e.message);
    }

    // 2. Search local samples
    const matchSampleProduct = (p) => {
      const title = (p.title || '').toLowerCase();
      const description = (p.description || '').toLowerCase();
      const color = (p.color || '').toLowerCase();
      const folder = (p.folder || '').toLowerCase();
      const categories = Array.isArray(p.categories) ? p.categories.map(c => String(c).toLowerCase()) : [];
      const sellerBusiness = (p.seller?.businessDetails?.businessName || '').toLowerCase();
      const sellerName = (p.seller?.sellerName || '').toLowerCase();

      const combined = `${title} ${description} ${color} ${folder} ${categories.join(' ')} ${sellerBusiness} ${sellerName}`;
      if (combined.includes(cleanQuery)) return true;

      if (queryTokens.length > 0) {
        return queryTokens.every(token => combined.includes(token));
      }
      return false;
    };

    let sampleMatches = [];
    try {
      const samples = this._getAllCategoryProducts();
      sampleMatches = samples.filter(matchSampleProduct);
    } catch (e) {}

    // Deduplicate
    const seenIds = new Set();
    const seenTitles = new Set();
    const combinedResults = [];

    [...dbMatches, ...sampleMatches].forEach(item => {
      const id = String(item._id || item.id || '');
      const title = (item.title || item.name || '').trim().toLowerCase();

      if (id && seenIds.has(id)) return;
      if (title && seenTitles.has(title)) return;

      if (id) seenIds.add(id);
      if (title) seenTitles.add(title);
      combinedResults.push(item);
    });

    return combinedResults;
  }

  _filterProductsByCategory(products, categoryStr) {
    const cat = (categoryStr || '').toLowerCase().trim();
    if (!cat || cat === 'all') return products;

    return products.filter(p => {
      if (p.categories && Array.isArray(p.categories)) {
        if (p.categories.some(c => c.toLowerCase() === cat || c.toLowerCase().includes(cat))) {
          return true;
        }
      }
      if (cat.includes('t_shirt') || cat.includes('tshirt')) return p.folder === 'men tshirt';
      if (cat.includes('shirt') && !cat.includes('t_shirt') && !cat.includes('tshirt')) return p.folder === 'Men shirt';
      if (cat === 'men' || cat === 'men_topwear') return p.folder === 'Men shirt' || p.folder === 'men tshirt';
      if (cat.includes('mobile') || cat.includes('smartphone') || cat.includes('phone')) return p.folder === 'mobile';
      if (cat.includes('watch')) return p.folder === 'watch';
      if (cat === 'electronics') return p.folder === 'mobile' || p.folder === 'watch';
      if (cat.includes('furniture') || cat.includes('decor')) return p.folder === 'furniture';
      return (p.title || '').toLowerCase().includes(cat);
    });
  }

  _getSampleProducts(categoryFilter) {
    const all = this._getAllCategoryProducts();
    if (!categoryFilter || categoryFilter === 'all') return all;
    return this._filterProductsByCategory(all, categoryFilter);
  }

  _getAllCategoryProducts() {
    if (this._cachedCategoryProducts && this._cachedCategoryProducts.length > 0) {
      return this._cachedCategoryProducts;
    }
    const baseImagesDir = path.join(__dirname, '..', '..', '..', 'product images');
    const allProducts = [];

    const getFiles = (dir) => {
      try {
        if (!fs.existsSync(dir)) return [];
        return fs.readdirSync(dir).filter(f => !f.startsWith('.') && fs.statSync(path.join(dir, f)).isFile());
      } catch (e) {
        return [];
      }
    };

    // 1. Men Shirts
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
        createdAt: new Date(),
        toObject: function() { return { ...this }; },
      });
    });

    // 2. Men T-Shirts
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
        createdAt: new Date(),
        toObject: function() { return { ...this }; },
      });
    });

    this._cachedCategoryProducts = allProducts;
    return allProducts;
  }
}

module.exports = new ProductService();
