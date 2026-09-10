const prisma = require('../config/prisma');
const jwtProvider = require('../utils/jwtProvider');
const bcrypt = require('bcrypt');
const SellerError = require('../exceptions/SellerError');

function formatSeller(seller) {
  if (!seller) return null;
  const payout = (seller.payoutAccountInfo && typeof seller.payoutAccountInfo === 'object')
    ? seller.payoutAccountInfo
    : {};
  const user = seller.user || {};
  const pickup = payout.pickupAddress || (user.addresses && user.addresses[0]) || {
    name: seller.storeName || 'Seller Pickup',
    locality: 'Main',
    address: 'Pickup Address',
    city: 'City',
    state: 'State',
    pinCode: '000000',
  };

  return {
    id: seller.id,
    _id: seller.id,
    sellerName: seller.storeName,
    storeName: seller.storeName,
    email: user.email || payout.email || '',
    mobile: user.phone || payout.mobile || '',
    GSTIN: payout.gstin || '',
    role: 'ROLE_SELLER',
    accountStatus: seller.verificationStatus ? seller.verificationStatus.toUpperCase() : 'ACTIVE',
    verificationStatus: seller.verificationStatus || 'active',
    tokenVersion: seller.tokenVersion ?? 0,
    isDeleted: Boolean(seller.isDeleted),
    isEmailVerified: true,
    bankDetails: payout.bankDetails || {},
    businessDetails: payout.businessDetails || { businessName: seller.storeName },
    pickupAddress: pickup,
    createdAt: seller.createdAt,
    toObject: function() { return { ...this }; },
  };
}

class SellerService {
  constructor() {
    this.fallbackSellers = new Map();
  }

  async getSellerProfile(jwt) {
    const email = jwtProvider.getEmailFromJwt(jwt);
    return this.getSellerByEmail(email);
  }

  async createSeller(sellerData) {
    const normalizedEmail = (sellerData.email || '').toLowerCase().trim();

    // Check existing
    const existing = await prisma.seller.findFirst({
      where: { user: { email: normalizedEmail } },
      include: { user: true },
    });

    if (existing) {
      throw new SellerError("A seller account with this email already exists. Each email can only register a single seller account.");
    }

    // Check or create backing User in Postgres
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const hashedPassword = sellerData.password
      ? await bcrypt.hash(sellerData.password, 10)
      : await bcrypt.hash("seller123", 10);

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: sellerData.sellerName || "Partner Seller",
          phone: sellerData.mobile || "9999999999",
          passwordHash: hashedPassword,
          role: 'SELLER',
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'SELLER' },
      });
    }

    // Pickup address
    let pickupAddr = sellerData.pickupAddress || {};
    if (pickupAddr.address || pickupAddr.line1) {
      try {
        const createdAddr = await prisma.address.create({
          data: {
            userId: user.id,
            line1: pickupAddr.address || pickupAddr.line1 || 'Main Street',
            line2: pickupAddr.locality || pickupAddr.line2 || '',
            city: pickupAddr.city || 'City',
            state: pickupAddr.state || 'State',
            pincode: String(pickupAddr.pinCode || pickupAddr.pincode || '000000'),
          },
        });
        pickupAddr = {
          id: createdAddr.id,
          _id: createdAddr.id,
          ...pickupAddr,
        };
      } catch (addrErr) {
        console.warn('[SellerService] Address creation note:', addrErr.message);
      }
    }

    const payoutAccountInfo = {
      bankDetails: sellerData.bankDetails || {},
      businessDetails: sellerData.businessDetails || {
        businessName: sellerData.sellerName || "Seller Store",
        businessEmail: normalizedEmail,
        businessMobile: sellerData.mobile || "9999999999",
      },
      gstin: sellerData.GSTIN || "",
      mobile: sellerData.mobile || "9999999999",
      pickupAddress: pickupAddr,
    };

    const seller = await prisma.seller.create({
      data: {
        userId: user.id,
        storeName: sellerData.sellerName || "Partner Seller",
        verificationStatus: 'active',
        payoutAccountInfo,
      },
      include: {
        user: { include: { addresses: true } },
      },
    });

    const formatted = formatSeller(seller);
    this.fallbackSellers.set(normalizedEmail, formatted);
    return formatted;
  }

  async getSellerById(id) {
    if (!id) throw new SellerError("Seller ID is required");

    try {
      const seller = await prisma.seller.findUnique({
        where: { id: String(id) },
        include: { user: { include: { addresses: true } } },
      });

      if (seller) return formatSeller(seller);
    } catch (e) {
      console.warn('[SellerService] getSellerById DB notice:', e.message);
    }

    // Fallback
    for (const s of this.fallbackSellers.values()) {
      if (String(s.id || s._id) === String(id)) return s;
    }

    throw new SellerError("Seller not found");
  }

  async getSellerByEmail(email) {
    const normalized = (email || '').toLowerCase().trim();

    try {
      const seller = await prisma.seller.findFirst({
        where: { user: { email: normalized } },
        include: { user: { include: { addresses: true } } },
      });

      if (seller) return formatSeller(seller);
    } catch (e) {
      console.warn('[SellerService] getSellerByEmail DB notice:', e.message);
    }

    const fallback = this.fallbackSellers.get(normalized);
    if (fallback) return fallback;

    throw new SellerError("Seller not found");
  }

  async getAllSellers(status) {
    const where = {};
    if (status) {
      where.verificationStatus = status.toLowerCase();
    }

    const sellers = await prisma.seller.findMany({
      where,
      include: { user: { include: { addresses: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return sellers.map(formatSeller);
  }

  async updateSeller(existingSeller, updateData) {
    const sellerId = existingSeller.id || existingSeller._id;
    const currentPayout = (existingSeller.payoutAccountInfo && typeof existingSeller.payoutAccountInfo === 'object')
      ? existingSeller.payoutAccountInfo
      : {};

    const updatedPayout = {
      ...currentPayout,
      bankDetails: updateData.bankDetails ? { ...(currentPayout.bankDetails || {}), ...updateData.bankDetails } : (currentPayout.bankDetails || {}),
      businessDetails: updateData.businessDetails ? { ...(currentPayout.businessDetails || {}), ...updateData.businessDetails } : (currentPayout.businessDetails || {}),
      gstin: updateData.GSTIN !== undefined ? updateData.GSTIN : (currentPayout.gstin || ''),
      mobile: updateData.mobile !== undefined ? updateData.mobile : (currentPayout.mobile || ''),
      pickupAddress: updateData.pickupAddress ? { ...(currentPayout.pickupAddress || {}), ...updateData.pickupAddress } : (currentPayout.pickupAddress || {}),
    };

    const sellerUpdateData = {
      payoutAccountInfo: updatedPayout,
    };
    if (updateData.sellerName) {
      sellerUpdateData.storeName = updateData.sellerName;
    }
    if (updateData.accountStatus) {
      sellerUpdateData.verificationStatus = updateData.accountStatus.toLowerCase();
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: String(sellerId) },
      data: sellerUpdateData,
      include: { user: { include: { addresses: true } } },
    });

    const formatted = formatSeller(updatedSeller);
    if (formatted.email) {
      this.fallbackSellers.set(formatted.email.toLowerCase().trim(), formatted);
    }
    return formatted;
  }

  async deleteSeller(id) {
    try {
      await prisma.seller.update({
        where: { id: String(id) },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          verificationStatus: 'closed',
          tokenVersion: { increment: 1 },
        },
      });
      await prisma.product.updateMany({
        where: { sellerId: String(id) },
        data: { isDeleted: true, deletedAt: new Date(), status: 'INACTIVE' },
      });
    } catch (e) {
      for (const [email, s] of this.fallbackSellers.entries()) {
        if (String(s.id || s._id) === String(id)) {
          this.fallbackSellers.delete(email);
        }
      }
    }
  }

  async verifyEmail(email, otp) {
    const seller = await this.getSellerByEmail(email);
    return await this.updateSellerAccountStatus(seller.id, 'ACTIVE');
  }

  async updateSellerAccountStatus(id, status) {
    const norm = (status || '').toLowerCase();
    const shouldRevoke = ['suspended', 'banned', 'closed', 'deactivated'].includes(norm);

    const updateData = { verificationStatus: norm };
    if (shouldRevoke) {
      updateData.tokenVersion = { increment: 1 };
    }

    const updated = await prisma.seller.update({
      where: { id: String(id) },
      data: updateData,
      include: { user: { include: { addresses: true } } },
    });
    return formatSeller(updated);
  }

  formatSeller(s) {
    return formatSeller(s);
  }
}

module.exports = new SellerService();
