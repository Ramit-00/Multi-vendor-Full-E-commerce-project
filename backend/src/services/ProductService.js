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
        status: { not: 'INACTIVE' },
        seller: {
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
          status: { not: 'INACTIVE' },
          seller: {
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
    const baseImagesDir = path.join(__dirname, '..', '..', '..', 'product images');
    const allProducts = [];

    const getFiles = (dir, folderName) => {
      // Priority 1: Check cloudinaryImageMap entries
      if (folderName && cloudinaryImageMap) {
        const prefix = folderName.toLowerCase() + '/';
        const matchingFiles = new Set();
        Object.keys(cloudinaryImageMap).forEach(key => {
          const lowerKey = key.toLowerCase();
          if (lowerKey.startsWith(prefix) && !key.includes('\\') && !key.endsWith('/')) {
            const sub = key.slice(folderName.length + 1);
            if (sub && !sub.includes('/')) {
              matchingFiles.add(sub);
            }
          }
        });
        if (matchingFiles.size > 0) {
          return Array.from(matchingFiles);
        }
      }
      try {
        if (!fs.existsSync(dir)) return [];
        return fs.readdirSync(dir).filter(f => !f.startsWith('.') && fs.statSync(path.join(dir, f)).isFile());
      } catch (e) {
        return [];
      }
    };

    // 1. Men Shirts (4 products)
    const shirtFiles = getFiles(path.join(baseImagesDir, 'Men shirt'), 'Men shirt');
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
        name: shirtTitles[i] || `Louis Philippe Men Shirt ${i + 1}`,
        sellingPrice: 1499 + (i * 200),
        price: 1499 + (i * 200),
        mrpPrice: 2499 + (i * 200),
        discountPercent: 40,
        images: [`Men shirt/${file}`],
        categories: ["men", "men_topwear", "men_formal_shirts", "men_casual_shirts", "men_shirts", "shirts"],
        category: "men_formal_shirts",
        folder: "Men shirt",
        color: i % 2 === 0 ? "White" : "Blue",
        sizes: ["M", "L", "XL"],
        stock: 20,
        quantity: 20,
        description: "Pure combed cotton shirt with tailored collar, breathable weave, and signature Louis Philippe detailing. Perfect for business meetings and evening gatherings.",
        seller: { businessDetails: { businessName: "Louis Philippe Official" }, sellerName: "Louis Philippe Official" },
        createdAt: new Date('2025-01-01'),
        toObject: function() { return { ...this }; },
      });
    });

    // 2. Men T-Shirts (3 products)
    const tshirtFiles = getFiles(path.join(baseImagesDir, 'men tshirt'), 'men tshirt');
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
        name: tshirtTitles[i] || `Urban Men T-Shirt ${i + 1}`,
        sellingPrice: 599 + (i * 100),
        price: 599 + (i * 100),
        mrpPrice: 999 + (i * 100),
        discountPercent: 40,
        images: [`men tshirt/${file}`],
        categories: ["men", "men_topwear", "men_t_shirts", "t_shirts", "tshirts"],
        category: "men_t_shirts",
        folder: "men tshirt",
        color: i === 0 ? "Black" : i === 1 ? "Navy" : "Olive",
        sizes: ["S", "M", "L", "XL"],
        stock: 35,
        quantity: 35,
        description: "100% premium pre-shrunk cotton t-shirt with reinforced crew neck and soft bio-wash finish for all-day comfort.",
        seller: { businessDetails: { businessName: "Urban Threads Co." }, sellerName: "Urban Threads Co." },
        createdAt: new Date('2025-01-02'),
        toObject: function() { return { ...this }; },
      });
    });

    // 3. Mobiles (2 products, 10 images)
    const mobileFiles = getFiles(path.join(baseImagesDir, 'mobile'), 'mobile');
    const mobileGroup1 = mobileFiles.filter(f => f.includes('imagx9eg'));
    const mobileGroup2 = mobileFiles.filter(f => f.includes('imagx9pf'));

    allProducts.push({
      _id: "mobile_motorola_edge_50",
      id: "mobile_motorola_edge_50",
      title: "Motorola Edge 50 Fusion 5G (Marshmallow Blue, 256 GB)",
      name: "Motorola Edge 50 Fusion 5G (Marshmallow Blue, 256 GB)",
      sellingPrice: 22999,
      price: 22999,
      mrpPrice: 25999,
      discountPercent: 12,
      images: (mobileGroup1.length > 0 ? mobileGroup1 : mobileFiles.slice(0, 6)).map(f => `mobile/${f}`),
      categories: ["electronics", "mobiles", "mobile", "smartphones", "phones"],
      category: "mobiles",
      folder: "mobile",
      color: "Blue",
      sizes: ["8GB RAM / 256GB Storage", "12GB RAM / 256GB Storage"],
      stock: 45,
      quantity: 45,
      description: "6.7 inch Curved Endless Edge pOLED 144Hz Display, Snapdragon 7s Gen 2 Processor, 50MP Sony LYTIA 700C OIS Camera, and 68W TurboPower charging.",
      seller: { businessDetails: { businessName: "Motorola Mobility Authorized" }, sellerName: "Motorola Mobility Authorized" },
      createdAt: new Date('2025-01-03'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "mobile_samsung_galaxy_s24",
      id: "mobile_samsung_galaxy_s24",
      title: "Samsung Galaxy S24 Ultra 5G (Titanium Gray, 256 GB)",
      name: "Samsung Galaxy S24 Ultra 5G (Titanium Gray, 256 GB)",
      sellingPrice: 129999,
      price: 129999,
      mrpPrice: 134999,
      discountPercent: 4,
      images: (mobileGroup2.length > 0 ? mobileGroup2 : mobileFiles.slice(6)).map(f => `mobile/${f}`),
      categories: ["electronics", "mobiles", "mobile", "smartphones", "phones", "samsung"],
      category: "mobiles",
      folder: "mobile",
      color: "Titanium Gray",
      sizes: ["12GB RAM / 256GB", "12GB RAM / 512GB"],
      stock: 20,
      quantity: 20,
      description: "Galaxy AI powered flagship with built-in S-Pen, Titanium exterior frame, 200MP Quad Telephoto Zoom, Dynamic AMOLED 2X flat display.",
      seller: { businessDetails: { businessName: "Samsung Official Brand Store" }, sellerName: "Samsung Official Brand Store" },
      createdAt: new Date('2025-01-04'),
      toObject: function() { return { ...this }; },
    });

    // 4. Smart Watches (6 products)
    const watchTitanFiles = [
      'android-ios-90172ap01-titan-yes-original-imagqggzvzabrhmv 1.webp',
      'android-ios-90172ap01-titan-yes-original-imagqggzvzabrhmv 2.webp',
      'android-ios-90172ap01-titan-yes-original-imagqggzvzabrhmv 3.webp'
    ];
    allProducts.push({
      _id: "watch_titan_celestor",
      id: "watch_titan_celestor",
      title: "Titan Celestor 1.43 AMOLED Smartwatch with BT Calling",
      name: "Titan Celestor 1.43 AMOLED Smartwatch with BT Calling",
      sellingPrice: 7995,
      price: 7995,
      mrpPrice: 12995,
      discountPercent: 38,
      images: watchTitanFiles.map(f => `watch/${f}`),
      categories: ["electronics", "smart_watches", "smartwatches", "watches", "watch"],
      category: "smart_watches",
      folder: "watch",
      color: "Black",
      sizes: ["Standard 46mm"],
      stock: 18,
      quantity: 18,
      description: "Premium aluminum case with 1.43 inch Ultra HD AMOLED display, SingleSync BT calling, comprehensive sleep and heart monitoring, 7-day battery life.",
      seller: { businessDetails: { businessName: "Titan Company Limited" }, sellerName: "Titan Company Limited" },
      createdAt: new Date('2025-01-05'),
      toObject: function() { return { ...this }; },
    });

    const watchCellecorFiles = [
      'pro-ray-android-ios-cellecor-yes-original-imagydnsrany7qhy 1.webp',
      'pro-ray-android-ios-cellecor-yes-original-imagydnsrany7qhy 2.webp',
      'pro-ray-android-ios-cellecor-yes-original-imagydnsrany7qhy 3.webp'
    ];
    allProducts.push({
      _id: "watch_cellecor_pro_ray",
      id: "watch_cellecor_pro_ray",
      title: "Cellecor Pro Ray Metallic Luxury Smartwatch",
      name: "Cellecor Pro Ray Metallic Luxury Smartwatch",
      sellingPrice: 2499,
      price: 2499,
      mrpPrice: 5999,
      discountPercent: 58,
      images: watchCellecorFiles.map(f => `watch/${f}`),
      categories: ["electronics", "smart_watches", "smartwatches", "watches", "watch"],
      category: "smart_watches",
      folder: "watch",
      color: "Metallic Silver",
      sizes: ["FREE"],
      stock: 25,
      quantity: 25,
      description: "Zinc-alloy metallic casing, crisp round touchscreen, continuous health sensors, and IP68 water resistance.",
      seller: { businessDetails: { businessName: "Cellecor Gadgets" }, sellerName: "Cellecor Gadgets" },
      createdAt: new Date('2025-01-06'),
      toObject: function() { return { ...this }; },
    });

    const watchBoatFiles = [
      '-original-imah87azdvcrh5zb.webp',
      '-original-imah87azegv93nxy.webp',
      '-original-imah87azqearxfxv.webp'
    ];
    allProducts.push({
      _id: "watch_boat_wave_sigma",
      id: "watch_boat_wave_sigma",
      title: "boAt Wave Sigma Smartwatch with 2.01 HD Display",
      name: "boAt Wave Sigma Smartwatch with 2.01 HD Display",
      sellingPrice: 1499,
      price: 1499,
      mrpPrice: 7499,
      discountPercent: 80,
      images: watchBoatFiles.map(f => `watch/boalt/${f}`),
      categories: ["electronics", "smart_watches", "smartwatches", "watches", "watch"],
      category: "smart_watches",
      folder: "watch",
      color: "Active Black",
      sizes: ["FREE"],
      stock: 50,
      quantity: 50,
      description: "Massive 2.01 inch HD display, 700+ active fitness modes, Bluetooth calling dial pad, and IP67 dust and sweat resistance.",
      seller: { businessDetails: { businessName: "boAt Lifestyle" }, sellerName: "boAt Lifestyle" },
      createdAt: new Date('2025-01-07'),
      toObject: function() { return { ...this }; },
    });

    const watchFirebolttFiles = [
      '-original-imah87az5fwmwyza.webp',
      '-original-imah87azbjeznk4h.webp',
      '-original-imah87azwrsnxhp3.webp'
    ];
    allProducts.push({
      _id: "watch_fireboltt_phoenix",
      id: "watch_fireboltt_phoenix",
      title: "Fire-Boltt Phoenix Bluetooth Calling Smartwatch",
      name: "Fire-Boltt Phoenix Bluetooth Calling Smartwatch",
      sellingPrice: 1699,
      price: 1699,
      mrpPrice: 8999,
      discountPercent: 81,
      images: watchFirebolttFiles.map(f => `watch/watch 2/${f}`),
      categories: ["electronics", "smart_watches", "smartwatches", "watches", "watch"],
      category: "smart_watches",
      folder: "watch",
      color: "Rose Gold",
      sizes: ["FREE"],
      stock: 30,
      quantity: 30,
      description: "1.3 inch TFT round display with high resolution, AI voice assistant, 120+ sports tracking, and high-fidelity speaker.",
      seller: { businessDetails: { businessName: "Fire-Boltt Official" }, sellerName: "Fire-Boltt Official" },
      createdAt: new Date('2025-01-08'),
      toObject: function() { return { ...this }; },
    });

    const watchPunnkFiles = [
      '39-glamor-5strap-1buds-android-ios-punnkfunnk-yes-original-imahdwumcztbajdh.webp',
      '39-glamor-5strap-1buds-android-ios-punnkfunnk-yes-original-imahdwumdqwhhxph.webp',
      '39-glamor-5strap-1buds-android-ios-punnkfunnk-yes-original-imahdwumhnagbgay.webp'
    ];
    allProducts.push({
      _id: "watch_punnkfunnk_glamor",
      id: "watch_punnkfunnk_glamor",
      title: "PunnkFunnk 39 Glamor Smartwatch with 5 Straps & Earbuds Combo",
      name: "PunnkFunnk 39 Glamor Smartwatch with 5 Straps & Earbuds Combo",
      sellingPrice: 2899,
      price: 2899,
      mrpPrice: 6999,
      discountPercent: 58,
      images: watchPunnkFiles.map(f => `watch/watch 3/${f}`),
      categories: ["electronics", "smart_watches", "smartwatches", "watches", "watch"],
      category: "smart_watches",
      folder: "watch",
      color: "Multi-Strap Edition",
      sizes: ["FREE"],
      stock: 15,
      quantity: 15,
      description: "All-in-one lifestyle gift combo: 2.0-inch HD smartwatch bundled with 5 interchangeable designer straps and wireless stereo earbuds.",
      seller: { businessDetails: { businessName: "PunnkFunnk Innovations" }, sellerName: "PunnkFunnk Innovations" },
      createdAt: new Date('2025-01-09'),
      toObject: function() { return { ...this }; },
    });

    const watchNoiseFiles = [
      '-original-imagufrhzkmdqdcp.webp',
      '-original-imagvytgakahgyfd.webp',
      '-original-imagvytgerzj5wkc.webp'
    ];
    allProducts.push({
      _id: "watch_noise_colorfit_pulse",
      id: "watch_noise_colorfit_pulse",
      title: "Noise ColorFit Pulse 2 Max 1.85 Display Smartwatch",
      name: "Noise ColorFit Pulse 2 Max 1.85 Display Smartwatch",
      sellingPrice: 1999,
      price: 1999,
      mrpPrice: 5999,
      discountPercent: 66,
      images: watchNoiseFiles.map(f => `watch/watch 4/${f}`),
      categories: ["electronics", "smart_watches", "smartwatches", "watches", "watch"],
      category: "smart_watches",
      folder: "watch",
      color: "Midnight Blue",
      sizes: ["FREE"],
      stock: 40,
      quantity: 40,
      description: "1.85-inch 550 nits bright display, Noise Health Suite with SpO2 and stress tracking, Bluetooth 5.3 calling with Tru Sync technology.",
      seller: { businessDetails: { businessName: "Noise Audio" }, sellerName: "Noise Audio" },
      createdAt: new Date('2025-01-10'),
      toObject: function() { return { ...this }; },
    });

    // 5. Furniture & Dining (1 product, 10 images)
    const runnerFiles = getFiles(path.join(baseImagesDir, 'furniture'), 'furniture');
    const runnerTitles = [
      "Royal Damask Embroidered Dining Table Runner (6 Seater)",
      "Artisan Handwoven Linen Cotton Dining Table Runner",
      "Vintage Floral Dining Accent Table Runner (Multi-color)"
    ];
    runnerFiles.forEach((file, i) => {
      allProducts.push({
        _id: `runner_${i}`,
        id: `runner_${i}`,
        title: runnerTitles[i] || `Dining Table Runner ${i + 1}`,
        name: runnerTitles[i] || `Dining Table Runner ${i + 1}`,
        sellingPrice: 799 + (i * 100),
        price: 799 + (i * 100),
        mrpPrice: 1499 + (i * 100),
        discountPercent: 46,
        images: [`furniture/${file}`],
        categories: ["home_furniture", "kitchen_table", "tableware_linens", "table_runners", "dining"],
        category: "kitchen_table",
        folder: "furniture",
        color: i === 0 ? "Gold Damask" : i === 1 ? "Ivory Linen" : "Teal Floral",
        sizes: ["13x72 inches (6 Seater)", "13x90 inches (8 Seater)"],
        stock: 22,
        quantity: 22,
        description: "Exquisite dining table runner crafted from heavy-gauge jacquard fabric with double-lined edge stitching and heat-resistant backing.",
        seller: { businessDetails: { businessName: "Heritage Home Furnishings" }, sellerName: "Heritage Home Furnishings" },
        createdAt: new Date('2025-01-11'),
        toObject: function() { return { ...this }; },
      });
    });

    // 6. Shop for Wedding (6 products)
    allProducts.push({
      _id: "wedding_lehenga_choli_silk",
      id: "wedding_lehenga_choli_silk",
      title: "Embellished Semi-Stitched Silk Bridal Lehenga Choli",
      name: "Embellished Semi-Stitched Silk Bridal Lehenga Choli",
      sellingPrice: 8999,
      price: 8999,
      mrpPrice: 17999,
      discountPercent: 50,
      images: ["shop for wedding/9930b235-5318-4755-abbe-08f99e969e781688026636544LehengaCholi7.jpg"],
      categories: ["women", "women_ethnic", "women_lehenga_cholis", "lehenga_choli", "shop_for_wedding", "wedding"],
      category: "women_lehenga_cholis",
      folder: "shop for wedding",
      color: "Pink & Gold",
      sizes: ["Semi-Stitched", "Custom Tailored"],
      stock: 8,
      quantity: 8,
      description: "Heavy zari embroidered semi-stitched bridal lehenga choli with sequin border work, matching art silk choli piece, and net dupatta.",
      seller: { businessDetails: { businessName: "Shree Bridal Couture" }, sellerName: "Shree Bridal Couture" },
      createdAt: new Date('2025-01-12'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "wedding_sherwani_groom",
      id: "wedding_sherwani_groom",
      title: "Royal Embroidered Silk Groom Sherwani Set",
      name: "Royal Embroidered Silk Groom Sherwani Set",
      sellingPrice: 12499,
      price: 12499,
      mrpPrice: 24999,
      discountPercent: 50,
      images: ["shop for wedding/20_3cfbd5a3-ecb6-482a-b798-7ffd9de1c784.webp"],
      categories: ["men", "men_ethnic", "men_sherwanis", "sherwanis", "shop_for_wedding", "wedding"],
      category: "men_sherwanis",
      folder: "shop for wedding",
      color: "Cream & Maroon",
      sizes: ["38", "40", "42", "44"],
      stock: 10,
      quantity: 10,
      description: "Handcrafted royal silk sherwani with hand-embroidered resham and zari detailing, Mandarin collar, churidar pants, and regal pocket square.",
      seller: { businessDetails: { businessName: "Shreeman Royal Ethnic" }, sellerName: "Shreeman Royal Ethnic" },
      createdAt: new Date('2025-01-13'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "wedding_loafers_formal",
      id: "wedding_loafers_formal",
      title: "House of Pataudi Men Tan Faux Leather Formal Slip-On Loafers",
      name: "House of Pataudi Men Tan Faux Leather Formal Slip-On Loafers",
      sellingPrice: 2199,
      price: 2199,
      mrpPrice: 4499,
      discountPercent: 51,
      images: ["shop for wedding/4fbf6d8c-d093-46c5-a5a6-7dd67c0c76551692964752597HouseofPataudiMenTanFauxLeatherFormalSlipOnLoafers1.jpg"],
      categories: ["men", "men_footwear", "men_formal_shoes", "formal_shoes", "shop_for_wedding", "wedding"],
      category: "men_formal_shoes",
      folder: "shop for wedding",
      color: "Tan Brown",
      sizes: ["7", "8", "9", "10", "11"],
      stock: 25,
      quantity: 25,
      description: "Premium synthetic faux leather formal slip-on loafers with cushioned insole and textured anti-skid outsole for celebratory elegance.",
      seller: { businessDetails: { businessName: "House of Pataudi Official" }, sellerName: "House of Pataudi Official" },
      createdAt: new Date('2025-01-14'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "wedding_wedges_pataudi",
      id: "wedding_wedges_pataudi",
      title: "House of Pataudi Women Maroon Embellished Handcrafted Wedges",
      name: "House of Pataudi Women Maroon Embellished Handcrafted Wedges",
      sellingPrice: 1899,
      price: 1899,
      mrpPrice: 3999,
      discountPercent: 52,
      images: ["shop for wedding/04e40e02-4c56-4705-94d0-f444b29973aa1629373611707-House-of-Pataudi-Women-Maroon-Embellished-Handcrafted-Wedges-1.jpg"],
      categories: ["women", "women_footwear", "footwear", "shop_for_wedding", "wedding"],
      category: "women_footwear",
      folder: "shop for wedding",
      color: "Maroon",
      sizes: ["36", "37", "38", "39", "40"],
      stock: 16,
      quantity: 16,
      description: "Embellished ethnic wedge sandals featuring traditional embroidery, cushioned footbed, and 2.5-inch wedge heel for festive comfort.",
      seller: { businessDetails: { businessName: "House of Pataudi Official" }, sellerName: "House of Pataudi Official" },
      createdAt: new Date('2025-01-15'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "wedding_necklace_temple",
      id: "wedding_necklace_temple",
      title: "Traditional 22K Gold Plated Antique Bridal Temple Necklace Set",
      name: "Traditional 22K Gold Plated Antique Bridal Temple Necklace Set",
      sellingPrice: 3499,
      price: 3499,
      mrpPrice: 6999,
      discountPercent: 50,
      images: ["shop for wedding/istockphoto-1276740597-612x612.jpg"],
      categories: ["women", "women_jewellery", "jewellery", "shop_for_wedding", "wedding"],
      category: "women_jewellery",
      folder: "shop for wedding",
      color: "Antique Gold",
      sizes: ["Adjustable"],
      stock: 12,
      quantity: 12,
      description: "Opulent handcrafted bridal temple necklace complete with matching jhumki earrings, embellished with ruby red and emerald green stones.",
      seller: { businessDetails: { businessName: "Kalyan Heritage Jewels" }, sellerName: "Kalyan Heritage Jewels" },
      createdAt: new Date('2025-01-16'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "wedding_lehenga_crimson",
      id: "wedding_lehenga_crimson",
      title: "Designer Crimson Velvet Embroidered Wedding Lehenga",
      name: "Designer Crimson Velvet Embroidered Wedding Lehenga",
      sellingPrice: 10499,
      price: 10499,
      mrpPrice: 21999,
      discountPercent: 52,
      images: ["shop for wedding/pexels-skgphotography-12730873.jpg"],
      categories: ["women", "women_ethnic", "women_lehenga_cholis", "lehenga_choli", "shop_for_wedding", "wedding"],
      category: "women_lehenga_cholis",
      folder: "shop for wedding",
      color: "Crimson Red",
      sizes: ["Semi-Stitched"],
      stock: 6,
      quantity: 6,
      description: "Intricately hand-embroidered crimson velvet lehenga with royal peacock motifs, heavy zardozi border, and scalloped tissue dupatta.",
      seller: { businessDetails: { businessName: "Sabyasachi Heritage Guild" }, sellerName: "Sabyasachi Heritage Guild" },
      createdAt: new Date('2025-01-17'),
      toObject: function() { return { ...this }; },
    });

    // 7. Products (Sarees - 11 products)
    allProducts.push({
      _id: "saree_kanjeevaram_tissue",
      id: "saree_kanjeevaram_tissue",
      title: "Tankori Floral Zari Tissue Kanjeevaram Silk Saree",
      name: "Tankori Floral Zari Tissue Kanjeevaram Silk Saree",
      sellingPrice: 3999,
      price: 3999,
      mrpPrice: 8999,
      discountPercent: 55,
      images: [
        "products/cf552069-d91d-4217-bb43-cb1998e0ee581715321471367-Tankori-Floral-Zari-Tissue-Kanjeevaram-Saree-405171532147109-1.jpg",
        "products/347cf3c8-1761-4232-b45e-ce752fc699651715321471352-Tankori-Floral-Zari-Tissue-Kanjeevaram-Saree-405171532147109-2.jpg",
        "products/45b98a98-c166-409b-b1d5-ad3fc3139ee71715321471338-Tankori-Floral-Zari-Tissue-Kanjeevaram-Saree-405171532147109-3.jpg",
        "products/ef1e0c49-4be6-4529-9d92-f2353957ecb81715321471310-Tankori-Floral-Zari-Tissue-Kanjeevaram-Saree-405171532147109-5.jpg",
        "products/1aedb64c-c2f6-4378-8e9f-26331cd12bf81715321471296-Tankori-Floral-Zari-Tissue-Kanjeevaram-Saree-405171532147109-6.jpg",
        "products/8c13ada1-9959-4e42-ab52-abd6bd9067931715321471281-Tankori-Floral-Zari-Tissue-Kanjeevaram-Saree-405171532147109-7.jpg"
      ],
      categories: ["women", "women_ethnic", "sarees", "women_sarees", "silk_sarees"],
      category: "sarees",
      folder: "products",
      color: "Tissue Gold",
      sizes: ["FREE (5.5m + 0.8m Blouse)"],
      stock: 14,
      quantity: 14,
      description: "Magnificent Kanjeevaram tissue saree woven with pure metallic zari threads, all-over floral jaal, and heavy bridal pallu.",
      seller: { businessDetails: { businessName: "Kanchi Weavers Guild" }, sellerName: "Kanchi Weavers Guild" },
      createdAt: new Date('2025-01-18'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "saree_banarasi_zari",
      id: "saree_banarasi_zari",
      title: "Royal Handwoven Banarasi Silk Saree with Zari Border",
      name: "Royal Handwoven Banarasi Silk Saree with Zari Border",
      sellingPrice: 4499,
      price: 4499,
      mrpPrice: 9999,
      discountPercent: 55,
      images: [
        "products/banarasi-saree 1.jpg",
        "products/banarasi-saree 2.webp",
        "products/banarasi-saree 3.webp"
      ],
      categories: ["women", "women_ethnic", "sarees", "women_sarees", "banarasi_sarees"],
      category: "sarees",
      folder: "products",
      color: "Royal Red",
      sizes: ["FREE (5.5m + 0.8m Blouse)"],
      stock: 18,
      quantity: 18,
      description: "Authentic Varanasi handloom silk saree featuring traditional paisley floral bootis, wide gold zari border, and matching unstitched blouse piece.",
      seller: { businessDetails: { businessName: "Banaras Heritage Silks" }, sellerName: "Banaras Heritage Silks" },
      createdAt: new Date('2025-01-19'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "saree_pure_chiffon",
      id: "saree_pure_chiffon",
      title: "Elegance Pure Chiffon Partywear Saree with Floral Pallu",
      name: "Elegance Pure Chiffon Partywear Saree with Floral Pallu",
      sellingPrice: 1899,
      price: 1899,
      mrpPrice: 3999,
      discountPercent: 52,
      images: [
        "products/PureChiffonSaree 1.jpg",
        "products/PureChiffonSaree 2.jpg",
        "products/PureChiffonSaree 3.jpg",
        "products/PureChiffonSaree 4.jpg",
        "products/PureChiffonSaree 5.jpg"
      ],
      categories: ["women", "women_ethnic", "sarees", "women_sarees", "chiffon_sarees"],
      category: "sarees",
      folder: "products",
      color: "Pastel Pink",
      sizes: ["FREE (5.5m + 0.8m Blouse)"],
      stock: 22,
      quantity: 22,
      description: "Featherlight pure chiffon saree with digital botanical prints, delicate satin border, and breezy drape suited for cocktail and summer soirees.",
      seller: { businessDetails: { businessName: "Surat Chiffon Mills" }, sellerName: "Surat Chiffon Mills" },
      createdAt: new Date('2025-01-20'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "saree_soft_silk_banarasi",
      id: "saree_soft_silk_banarasi",
      title: "Soft Silk Festive Zari Woven Saree with Unstitched Blouse",
      name: "Soft Silk Festive Zari Woven Saree with Unstitched Blouse",
      sellingPrice: 2799,
      price: 2799,
      mrpPrice: 5499,
      discountPercent: 49,
      images: [
        "products/SoftSilkZariBanarasiSaree 1.jpg",
        "products/SoftSilkZariBanarasiSaree 2.jpg",
        "products/SoftSilkZariBanarasiSaree 3.jpg",
        "products/SoftSilkZariBanarasiSaree 4.jpg"
      ],
      categories: ["women", "women_ethnic", "sarees", "women_sarees"],
      category: "sarees",
      folder: "products",
      color: "Teal Green",
      sizes: ["FREE (5.5m + 0.8m Blouse)"],
      stock: 16,
      quantity: 16,
      description: "Ultra-soft art silk saree woven with intricate floral zari jaal and contrast rich pallu, combining festival splendor with lightweight ease.",
      seller: { businessDetails: { businessName: "Kalyan Ethnic Collections" }, sellerName: "Kalyan Ethnic Collections" },
      createdAt: new Date('2025-01-21'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "saree_textilehub_georgette",
      id: "saree_textilehub_georgette",
      title: "The Textile Hub Floral Printed Poly Georgette Dailywear Saree",
      name: "The Textile Hub Floral Printed Poly Georgette Dailywear Saree",
      sellingPrice: 899,
      price: 899,
      mrpPrice: 2199,
      discountPercent: 59,
      images: [
        "products/TheTextileHubFloralPolyGeorgetteSaree 1.jpg",
        "products/TheTextileHubFloralPolyGeorgetteSaree 2.jpg",
        "products/TheTextileHubFloralPolyGeorgetteSaree 3.jpg",
        "products/TheTextileHubFloralPolyGeorgetteSaree 4.jpg"
      ],
      categories: ["women", "women_ethnic", "sarees", "women_sarees"],
      category: "sarees",
      folder: "products",
      color: "Floral Cream",
      sizes: ["FREE (5.5m + 0.8m Blouse)"],
      stock: 35,
      quantity: 35,
      description: "Easy-care poly georgette saree with soft drape, vivid multicolor floral blossoms, and matching lightweight blouse fabric.",
      seller: { businessDetails: { businessName: "The Textile Hub" }, sellerName: "The Textile Hub" },
      createdAt: new Date('2025-01-22'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "saree_sequinned_embroidered",
      id: "saree_sequinned_embroidered",
      title: "Glamour Sequinned Embroidered Border Party Saree",
      name: "Glamour Sequinned Embroidered Border Party Saree",
      sellingPrice: 3299,
      price: 3299,
      mrpPrice: 6999,
      discountPercent: 52,
      images: [
        "products/WomenSequinnedEmbroideredBorderSareewithBlousePiece 1.jpg",
        "products/WomenSequinnedEmbroideredBorderSareewithBlousePiece 2.jpg",
        "products/WomenSequinnedEmbroideredBorderSareewithBlousePiece 3.jpg",
        "products/WomenSequinnedEmbroideredBorderSareewithBlousePiece 4.jpg"
      ],
      categories: ["women", "women_ethnic", "sarees", "women_sarees"],
      category: "sarees",
      folder: "products",
      color: "Burgundy Wine",
      sizes: ["FREE (5.5m + 0.8m Blouse)"],
      stock: 20,
      quantity: 20,
      description: "Statement party saree embellished with micro shimmer sequins along scallop cut-work borders on smooth georgette fabric.",
      seller: { businessDetails: { businessName: "Glamour Diva Ethnic" }, sellerName: "Glamour Diva Ethnic" },
      createdAt: new Date('2025-01-23'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "saree_embroidered_bandha",
      id: "saree_embroidered_bandha",
      title: "Traditional Embroidered Bandhej Silk Saree",
      name: "Traditional Embroidered Bandhej Silk Saree",
      sellingPrice: 2499,
      price: 2499,
      mrpPrice: 4999,
      discountPercent: 50,
      images: [
        "products/Embroidered-Bandha-1.jpg",
        "products/Embroidered-Bandha-2.jpg",
        "products/Embroidered-Bandha-3.jpg",
        "products/Embroidered-Bandha-4.jpg",
        "products/Embroidered-Bandha-5.jpg"
      ],
      categories: ["women", "women_ethnic", "sarees", "women_sarees"],
      category: "sarees",
      folder: "products",
      color: "Bandhej Red",
      sizes: ["FREE (5.5m + 0.8m Blouse)"],
      stock: 15,
      quantity: 15,
      description: "Authentic Gujarati Bandhej tie-dye artwork enhanced with delicate gota patti mirror embroidery on fine art silk.",
      seller: { businessDetails: { businessName: "Jaipur Bandhej Art" }, sellerName: "Jaipur Bandhej Art" },
      createdAt: new Date('2025-01-24'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "saree_suhani_georgette",
      id: "saree_suhani_georgette",
      title: "Suhani Heritage Georgette Zari Work Saree",
      name: "Suhani Heritage Georgette Zari Work Saree",
      sellingPrice: 1999,
      price: 1999,
      mrpPrice: 4299,
      discountPercent: 53,
      images: [
        "products/SUHANI-2011_2.webp",
        "products/SUHANI-2011_4.webp",
        "products/SUHANI-2011_5.webp"
      ],
      categories: ["women", "women_ethnic", "sarees", "women_sarees"],
      category: "sarees",
      folder: "products",
      color: "Plum Purple",
      sizes: ["FREE (5.5m + 0.8m Blouse)"],
      stock: 18,
      quantity: 18,
      description: "Rich georgette saree adorned with heritage golden zari buttas and woven lace border, paired with an art silk blouse piece.",
      seller: { businessDetails: { businessName: "Suhani Fashion House" }, sellerName: "Suhani Fashion House" },
      createdAt: new Date('2025-01-25'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "saree_midnight_black",
      id: "saree_midnight_black",
      title: "Midnight Black Contemporary Designer Chiffon Saree",
      name: "Midnight Black Contemporary Designer Chiffon Saree",
      sellingPrice: 2199,
      price: 2199,
      mrpPrice: 4599,
      discountPercent: 52,
      images: [
        "products/black 1.jpg",
        "products/black 2.jpg",
        "products/black 3.jpg",
        "products/black 4.jpg"
      ],
      categories: ["women", "women_ethnic", "sarees", "women_sarees"],
      category: "sarees",
      folder: "products",
      color: "Midnight Black",
      sizes: ["FREE (5.5m + 0.8m Blouse)"],
      stock: 20,
      quantity: 20,
      description: "Dramatic jet-black chiffon saree featuring minimalist golden piping and glossy satin touch for modern evening celebrations.",
      seller: { businessDetails: { businessName: "Noir Ethnic Studio" }, sellerName: "Noir Ethnic Studio" },
      createdAt: new Date('2025-01-26'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "saree_emerald_green",
      id: "saree_emerald_green",
      title: "Emerald Green Handloom Art Silk Saree",
      name: "Emerald Green Handloom Art Silk Saree",
      sellingPrice: 1799,
      price: 1799,
      mrpPrice: 3899,
      discountPercent: 53,
      images: [
        "products/green 1.jpg",
        "products/green 2.jpg",
        "products/green 3.jpg"
      ],
      categories: ["women", "women_ethnic", "sarees", "women_sarees"],
      category: "sarees",
      folder: "products",
      color: "Emerald Green",
      sizes: ["FREE (5.5m + 0.8m Blouse)"],
      stock: 14,
      quantity: 14,
      description: "Vibrant emerald green saree woven with classic floral motifs and antique bronze zari pallu.",
      seller: { businessDetails: { businessName: "Vedic Weaves" }, sellerName: "Vedic Weaves" },
      createdAt: new Date('2025-01-27'),
      toObject: function() { return { ...this }; },
    });

    allProducts.push({
      _id: "saree_mustard_yellow",
      id: "saree_mustard_yellow",
      title: "Mustard Yellow Festive Haldi Silk Saree with Contrast Border",
      name: "Mustard Yellow Festive Haldi Silk Saree with Contrast Border",
      sellingPrice: 2099,
      price: 2099,
      mrpPrice: 4499,
      discountPercent: 53,
      images: [
        "products/yellow 1.jpg",
        "products/yellow 2.jpg",
        "products/yellow 3.jpg"
      ],
      categories: ["women", "women_ethnic", "sarees", "women_sarees"],
      category: "sarees",
      folder: "products",
      color: "Mustard Yellow",
      sizes: ["FREE (5.5m + 0.8m Blouse)"],
      stock: 16,
      quantity: 16,
      description: "Festive auspicious yellow silk saree ideal for Haldi rituals and celebrations, with bright magenta zari border.",
      seller: { businessDetails: { businessName: "Vedic Weaves" }, sellerName: "Vedic Weaves" },
      createdAt: new Date('2025-01-28'),
      toObject: function() { return { ...this }; },
    });

    allProducts.forEach(p => {
      if (Array.isArray(p.images)) {
        p.images = p.images.map(resolveCloudinaryUrl);
      }
    });

    this._cachedCategoryProducts = allProducts;
    return allProducts;
  }
}

module.exports = new ProductService();
