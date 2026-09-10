const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const prisma = require('../config/prisma');
const ProductDetails = require('../models/ProductDetails');
const Category = require('../models/Category');
const ProductError = require('../exceptions/ProductError');

let cloudinaryImageMap = {};
try {
  cloudinaryImageMap = require('../config/cloudinaryImageMap.json');
} catch (e) {
  cloudinaryImageMap = {};
}

let seedProducts = [];
try {
  seedProducts = require('../data/seedProducts.json');
} catch (e) {
  seedProducts = [];
}

function resolveCloudinaryUrl(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return imagePath;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  if (cloudinaryImageMap[imagePath]) return cloudinaryImageMap[imagePath];
  if (cloudinaryImageMap[imagePath.toLowerCase()]) return cloudinaryImageMap[imagePath.toLowerCase()];
  const basename = imagePath.split(/[/\\]/).pop();
  if (cloudinaryImageMap[basename]) return cloudinaryImageMap[basename];
  if (cloudinaryImageMap[basename.toLowerCase()]) return cloudinaryImageMap[basename.toLowerCase()];
  return imagePath;
}

function isSellerSuspended(seller) {
  if (!seller) return false;
  const status = (seller.verificationStatus || seller.accountStatus || seller.status || '').toUpperCase();
  return status === 'SUSPENDED' || status === 'BANNED' || status === 'DEACTIVATED';
}

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

    const sellerStatus = (seller.verificationStatus || seller.accountStatus || 'active').toUpperCase();
    const formattedSeller = {
      id: seller.id || core.sellerId,
      _id: seller.id || core.sellerId,
      sellerName: seller.storeName || 'Partner Seller',
      storeName: seller.storeName || 'Partner Seller',
      email: sellerUser.email || '',
      mobile: sellerUser.phone || '',
      status: sellerStatus,
      accountStatus: sellerStatus,
      businessDetails: sellerPayout.businessDetails || { businessName: seller.storeName || 'Partner Seller' },
    };

    const mrpPrice = Number(attributes.mrpPrice) || Number(core.price);
    const sellingPrice = Number(core.price);
    const discountPercent = attributes.discountPercent !== undefined
      ? Number(attributes.discountPercent)
      : calculateDiscountPercentage(mrpPrice, sellingPrice);

    let finalImages = Array.isArray(details?.images) && details.images.length > 0
      ? details.images
      : [];

    if (finalImages.length === 0) {
      const lowerName = (core.name || '').toLowerCase();
      if (lowerName.includes('t-shirt') || lowerName.includes('tshirt')) {
        finalImages = ['men tshirt/4QdHw1UN_f8db19fa1b1947689b2cc1f461b25b14.jpg'];
      } else if (lowerName.includes('shirt')) {
        finalImages = ['Men shirt/Louis-Philippe-Men-Shirts 1.jpg'];
      } else if (lowerName.includes('chess')) {
        finalImages = ['https://res.cloudinary.com/pddxfqxe/image/upload/v1789038165/ecom_products/products/heritage_wooden_chess_set.jpg'];
      }
    }

    // Resolve all image paths to Cloudinary CDN HTTPS URLs
    finalImages = finalImages.map(img => resolveCloudinaryUrl(img));

    // Seller suspension check: if product is inactive or seller is suspended/banned, mask images
    const isSuspended = core.status === 'INACTIVE' ||
      core.status === 'SUSPENDED' ||
      isSellerSuspended(seller) ||
      isSellerSuspended(core.seller);

    if (isSuspended) {
      finalImages = [];
    }

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
      images: finalImages,
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
        if (core.isDeleted) {
          throw new ProductError('This product has been deleted and is no longer available.');
        }
        if (core.status === 'INACTIVE' || core.status === 'SUSPENDED' || isSellerSuspended(core.seller)) {
          throw new ProductError('This product is unavailable as the seller account has been suspended.');
        }

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
      if (err instanceof ProductError) throw err;
      console.warn('[ProductService] findProductById DB notice:', err.message);
    }

    if (match) return match;
    throw new ProductError('Product not found');
  }

  async updateProduct(productId, updatedProductData, requestingSellerId = null) {
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

      if (requestingSellerId && core.sellerId && String(core.sellerId) !== String(requestingSellerId)) {
        throw new ProductError('Access denied: You are not authorized to update this product');
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

  async deleteProduct(productId, requestingSellerId = null) {
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

      if (requestingSellerId && core.sellerId && String(core.sellerId) !== String(requestingSellerId)) {
        throw new ProductError('Access denied: You are not authorized to delete this product');
      }

      if (core) {
        // Purge associated product images from Cloudinary storage to reclaim space
        try {
          const details = await ProductDetails.findOne({
            $or: [{ productId: core.id }, ...(core.mongoDetailsId ? [{ _id: core.mongoDetailsId }] : [])],
          });
          if (details && Array.isArray(details.images) && details.images.length > 0) {
            const { deleteImages } = require('../config/cloudinary');
            await deleteImages(details.images);
          }
        } catch (imgErr) {
          console.warn('[ProductService] Cloudinary asset cleanup notice:', imgErr.message);
        }

        await prisma.product.update({
          where: { id: core.id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            status: 'INACTIVE',
          },
        });

        // Cross-database cascade: purge from active customer carts
        try {
          const CartItem = require('../models/CartItem');
          await CartItem.deleteMany({
            product: { $in: [core.id, String(core.id), core.mongoDetailsId, productId] },
          });
        } catch (cartCascadeErr) {
          console.warn('[ProductService] CartItem cascade cleanup notice:', cartCascadeErr.message);
        }

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
        where: {
          sellerId: String(sellerId),
          isDeleted: false,
        },
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
        where: {
          isDeleted: false,
          status: { not: 'INACTIVE' },
          seller: {
            isDeleted: false,
            verificationStatus: { notIn: ['suspended', 'banned'] }
          }
        },
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

  _doesProductMatchCategory(product, requestedCategory) {
    const cat = (requestedCategory || '').toLowerCase().trim();
    if (!cat || cat === 'all') return true;

    // Explicit list of categories currently having 0 catalog inventory in the store
    const emptyCategories = new Set([
      'home_decor', 'decor', 'flooring', 'bath', 'lamps_lighting', 'bed_linen_furnishing',
      'laptops', 'headphones_headsets', 'speakers', 'television', 'cameras',
      'men_bottomwear', 'men_innerwear_and_sleepwear',
      'women_lingerie_sleepwear', 'women_western_wear', 'women_sports_active_wear',
      'women_skirts_palazzos', 'men_indian_and_festive_wear'
    ]);

    if (emptyCategories.has(cat)) {
      return false;
    }

    // Collect all category identifiers from product
    const productCategories = new Set();

    if (Array.isArray(product.categories)) {
      product.categories.forEach(c => productCategories.add(String(c).toLowerCase().trim()));
    }
    if (product.category) {
      if (typeof product.category === 'string') {
        productCategories.add(product.category.toLowerCase().trim());
      } else if (typeof product.category === 'object') {
        if (product.category.categoryId) productCategories.add(String(product.category.categoryId).toLowerCase().trim());
        if (product.category.name) productCategories.add(String(product.category.name).toLowerCase().trim());
      }
    }
    if (product.categoryId) {
      productCategories.add(String(product.categoryId).toLowerCase().trim());
    }

    // Check direct category match
    if (productCategories.has(cat)) return true;

    // Direct normalized comparison (ignoring underscores, hyphens, spaces)
    const normCat = cat.replace(/[-_ ]/g, '');
    for (const c of productCategories) {
      if (c.replace(/[-_ ]/g, '') === normCat) return true;
    }

    // Check specific category aliases and hierarchies
    const isMobileQuery = ['mobiles', 'mobile', 'smartphones', 'smartphone', 'phone', 'phones'].includes(cat);
    if (isMobileQuery) {
      if (product.folder === 'mobile') return true;
      if (productCategories.has('mobiles') || productCategories.has('mobile') || productCategories.has('samsung')) return true;
    }

    const isWatchQuery = ['smart_watches', 'smartwatches', 'smartwatch', 'watch', 'watches'].includes(cat);
    if (isWatchQuery) {
      if (product.folder === 'watch') return true;
      if (productCategories.has('smart_watches') || productCategories.has('smartwatches') || productCategories.has('watch')) return true;
    }

    const isSareeQuery = ['sarees', 'saree', 'women_sarees', 'silk_sarees', 'banarasi_sarees', 'chiffon_sarees'].includes(cat);
    if (isSareeQuery) {
      if (product.folder === 'products') return true;
      if (productCategories.has('sarees') || productCategories.has('women_sarees')) return true;
    }

    const isFormalShirtQuery = ['men_formal_shirts', 'formal_shirts', 'men_casual_shirts', 'men_shirts', 'shirts'].includes(cat);
    if (isFormalShirtQuery) {
      if (product.folder === 'Men shirt') return true;
      const title = (product.title || product.name || '').toLowerCase();
      if (title.includes('shirt') && !title.includes('t-shirt') && !title.includes('tshirt')) return true;
    }

    const isTshirtQuery = ['men_t_shirts', 't_shirts', 'tshirts', 'tshirt', 't-shirt'].includes(cat);
    if (isTshirtQuery) {
      if (product.folder === 'men tshirt') return true;
      const title = (product.title || product.name || '').toLowerCase();
      if (title.includes('t-shirt') || title.includes('tshirt')) return true;
    }

    const isMenTopwearQuery = ['men', 'men_topwear'].includes(cat);
    if (isMenTopwearQuery) {
      if (product.folder === 'Men shirt' || product.folder === 'men tshirt') return true;
      const title = (product.title || product.name || '').toLowerCase();
      if (title.includes('shirt') || title.includes('t-shirt')) return true;
    }

    const isWeddingQuery = ['shop_for_wedding', 'wedding', 'bridal'].includes(cat);
    if (isWeddingQuery) {
      return product.folder === 'shop for wedding' || productCategories.has('shop_for_wedding');
    }

    if (cat === 'women_lehenga_cholis' || cat === 'lehenga_choli' || cat === 'lehenga') {
      return productCategories.has('women_lehenga_cholis') || productCategories.has('lehenga_choli');
    }

    if (cat === 'men_sherwanis' || cat === 'sherwanis' || cat === 'sherwani') {
      return productCategories.has('men_sherwanis') || productCategories.has('sherwanis');
    }

    if (cat === 'men_formal_shoes' || cat === 'formal_shoes') {
      return productCategories.has('men_formal_shoes') || productCategories.has('formal_shoes');
    }

    if (cat === 'women_jewellery' || cat === 'jewellery' || cat === 'jewelry') {
      return productCategories.has('women_jewellery') || productCategories.has('jewellery');
    }

    if (cat === 'women_footwear' || cat === 'footwear') {
      return productCategories.has('women_footwear') || productCategories.has('footwear');
    }

    if (cat === 'women' || cat === 'women_ethnic') {
      return product.folder === 'products' || productCategories.has('women') || productCategories.has('women_ethnic');
    }

    if (cat === 'electronics') {
      return product.folder === 'mobile' || product.folder === 'watch' || productCategories.has('electronics') || productCategories.has('mobiles');
    }

    const isFurnitureOrKitchen = ['home_furniture', 'kitchen_table', 'tableware_linens', 'table_runners', 'dining'].includes(cat);
    if (isFurnitureOrKitchen) {
      return product.folder === 'furniture' || productCategories.has('home_furniture') || productCategories.has('kitchen_table');
    }

    if (cat === 'wooden_crafts') {
      const title = (product.title || product.name || '').toLowerCase();
      return title.includes('chess') || productCategories.has('wooden_crafts');
    }

    return false;
  }

  async getAllProducts(req = {}) {
    const requestedCategory = (req.category || '').toLowerCase().trim();
    let dbProducts = [];

    try {
      const where = {
        isDeleted: false,
        status: { not: 'INACTIVE' },
        seller: {
          isDeleted: false,
          verificationStatus: { notIn: ['suspended', 'banned'] }
        }
      };
      if (req.minPrice) where.price = { ...(where.price || {}), gte: Number(req.minPrice) };
      if (req.maxPrice) where.price = { ...(where.price || {}), lte: Number(req.maxPrice) };
      if (req.stock) where.stockQuantity = { gte: Number(req.stock) };

      const cores = await prisma.product.findMany({
        where,
        include: { seller: { include: { user: true } } },
      });

      const productIds = cores.map(p => p.id);
      const detailsList = await ProductDetails.find({ productId: { $in: productIds } });
      const detailsMap = new Map(detailsList.map(d => [d.productId, d]));

      // Resolve category documents for DB products to ensure accurate matching
      const categoryIds = cores.map(p => p.categoryId).filter(Boolean);
      let catMap = new Map();
      if (categoryIds.length > 0) {
        try {
          const cats = await Category.find({
            $or: [
              { _id: { $in: categoryIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
              { categoryId: { $in: categoryIds } }
            ]
          });
          cats.forEach(c => {
            catMap.set(c._id.toString(), c);
            catMap.set(c.categoryId, c);
          });
        } catch (catErr) {}
      }

      const formatted = cores.map(p => {
        const catDoc = p.categoryId ? catMap.get(p.categoryId) : null;
        return this._formatFullProduct(p, detailsMap.get(p.id), catDoc);
      });

      // Filter DB products strictly by category
      if (requestedCategory && requestedCategory !== 'all') {
        dbProducts = formatted.filter(p => this._doesProductMatchCategory(p, requestedCategory));
      } else {
        dbProducts = formatted;
      }
    } catch (dbErr) {
      console.warn('[ProductService] getAllProducts DB notice:', dbErr.message);
    }

    // Get samples matching the requested category
    let samples = this._getSampleProducts(requestedCategory);

    // Apply color filtering
    if (req.color) {
      const targetColor = req.color.toLowerCase();
      samples = samples.filter(p => (p.color || '').toLowerCase() === targetColor);
      dbProducts = dbProducts.filter(p => (p.color || '').toLowerCase() === targetColor);
    }

    // Apply price filtering
    if (req.minPrice) {
      const minP = Number(req.minPrice);
      samples = samples.filter(p => (p.sellingPrice || p.price) >= minP);
      dbProducts = dbProducts.filter(p => (p.sellingPrice || p.price) >= minP);
    }
    if (req.maxPrice) {
      const maxP = Number(req.maxPrice);
      samples = samples.filter(p => (p.sellingPrice || p.price) <= maxP);
      dbProducts = dbProducts.filter(p => (p.sellingPrice || p.price) <= maxP);
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

    // Apply sorting
    if (req.sort === 'price_low') {
      combined.sort((a, b) => (a.sellingPrice || a.price) - (b.sellingPrice || b.price));
    } else if (req.sort === 'price_high') {
      combined.sort((a, b) => (b.sellingPrice || b.price) - (a.sellingPrice || a.price));
    }

    const pageSize = parseInt(req.pageSize) || 20;
    const pageNumber = parseInt(req.pageNumber) || 0;
    const paginated = combined.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize);

    return {
      content: paginated,
      totalPages: Math.ceil(combined.length / pageSize) || (combined.length === 0 ? 0 : 1),
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
          isDeleted: false,
          status: { not: 'INACTIVE' },
          seller: {
            isDeleted: false,
            verificationStatus: { notIn: ['suspended', 'banned'] }
          },
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
      const title = (p.title || p.name || '').toLowerCase();
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
    return products.filter(p => this._doesProductMatchCategory(p, cat));
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
    this._cachedCategoryProducts = seedProducts.map(p => ({
      ...p,
      toObject: function() { return { ...this }; }
    }));
    return this._cachedCategoryProducts;
  }
}

module.exports = new ProductService();
