const mongoose = require("mongoose");
const Seller = require("../models/Seller");
const Address = require("../models/Address");
const jwtProvider = require("../utils/jwtProvider");
const bcrypt = require("bcrypt");
const UserRoles = require("../domain/UserRole");
const AccountStatus = require("../domain/AccountStatus");
const SellerError = require("../exceptions/SellerError");

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
    const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

    let existingSeller = null;
    if (dbConnected) {
      existingSeller = await Seller.findOne({ email: normalizedEmail });
    } else {
      existingSeller = this.fallbackSellers.get(normalizedEmail);
    }
    if (existingSeller) {
      throw new SellerError("A seller account with this email already exists. Each email can only register a single seller account.");
    }

    let savedAddress = sellerData.pickupAddress || {};
    if (!savedAddress._id) {
      try {
        savedAddress = await Address.create({
          name: savedAddress.name || sellerData.sellerName || "Seller Pickup",
          locality: savedAddress.locality || "City Center",
          address: savedAddress.address || "Main Street",
          city: savedAddress.city || "Metropolis",
          state: savedAddress.state || "State",
          pinCode: savedAddress.pinCode || "110001",
          mobile: savedAddress.mobile || sellerData.mobile || "9876543210"
        });
      } catch (err) {
        savedAddress = {
          ...savedAddress,
          _id: `addr_${Date.now()}`
        };
      }
    }

    const hashedPassword = sellerData.password
      ? await bcrypt.hash(sellerData.password, 10)
      : await bcrypt.hash("seller123", 10);

    const newSeller = new Seller({
      email: sellerData.email,
      pickupAddress: savedAddress._id || savedAddress,
      sellerName: sellerData.sellerName || "Partner Seller",
      GSTIN: sellerData.GSTIN || "22AAAAA0000A1Z5",
      role: UserRoles.SELLER,
      mobile: sellerData.mobile || "9999999999",
      password: hashedPassword,
      bankDetails: {
        accountNumber: sellerData.bankDetails?.accountNumber || "000000000000",
        accountHolderName: sellerData.bankDetails?.accountHolderName || sellerData.sellerName || "Seller Account",
        ifscCode: sellerData.bankDetails?.ifscCode || "SBIN0001234",
      },
      businessDetails: {
        businessName: sellerData.businessDetails?.businessName || sellerData.sellerName || "Seller Store",
        businessEmail: sellerData.businessDetails?.businessEmail || sellerData.email,
        businessMobile: sellerData.businessDetails?.businessMobile || sellerData.mobile,
        businessAddress: sellerData.businessDetails?.businessAddress || "",
        logo: sellerData.businessDetails?.logo || "",
        banner: sellerData.businessDetails?.banner || "",
      },
      isEmailVerified: true,
      accountStatus: AccountStatus.ACTIVE,
    });

    if (dbConnected) {
      return await newSeller.save();
    } else {
      const fallbackSeller = {
        _id: `offline_seller_${Date.now()}`,
        email: sellerData.email,
        sellerName: sellerData.sellerName || "Partner Seller",
        GSTIN: sellerData.GSTIN || "22AAAAA0000A1Z5",
        role: UserRoles.SELLER,
        mobile: sellerData.mobile || "9999999999",
        password: hashedPassword,
        accountStatus: AccountStatus.ACTIVE,
        isEmailVerified: true,
        businessDetails: sellerData.businessDetails || {},
        bankDetails: sellerData.bankDetails || {},
        pickupAddress: savedAddress,
        toObject: function() { return { ...this }; }
      };
      this.fallbackSellers.set(normalizedEmail, fallbackSeller);
      return fallbackSeller;
    }
  }

  async getSellerById(id) {
    const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;
    if (dbConnected) {
      const seller = await Seller.findById(id);
      if (!seller) throw new SellerError("Seller not found");
      return seller;
    } else {
      for (const s of this.fallbackSellers.values()) {
        if (String(s._id) === String(id)) return s;
      }
      throw new SellerError("Seller not found");
    }
  }

  async getSellerByEmail(email) {
    const normalized = (email || '').toLowerCase().trim();
    const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

    let seller = null;
    if (dbConnected) {
      seller = await Seller.findOne({ email: normalized }).populate("pickupAddress");
    } else {
      seller = this.fallbackSellers.get(normalized);
    }
    if (!seller) {
      throw new SellerError("Seller not found");
    }
    return seller;
  }

  async getAllSellers(status) {
    if (!status) return await Seller.find();
    return await Seller.find({ accountStatus: status });
  }

  async updateSeller(existingSeller, updateData) {
    const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;
    if (dbConnected) {
      const updated = await Seller.findByIdAndUpdate(
        existingSeller._id,
        { $set: updateData },
        { new: true }
      );
      return updated;
    } else {
      const normalized = (existingSeller?.email || '').toLowerCase().trim();
      const s = this.fallbackSellers.get(normalized) || existingSeller || {};
      Object.assign(s, updateData);
      if (updateData.businessDetails) {
        s.businessDetails = { ...(s.businessDetails || {}), ...updateData.businessDetails };
      }
      if (updateData.pickupAddress) {
        s.pickupAddress = { ...(s.pickupAddress || {}), ...updateData.pickupAddress };
      }
      if (updateData.bankDetails) {
        s.bankDetails = { ...(s.bankDetails || {}), ...updateData.bankDetails };
      }
      if (updateData.email && updateData.email.toLowerCase().trim() !== normalized) {
        this.fallbackSellers.delete(normalized);
        this.fallbackSellers.set(updateData.email.toLowerCase().trim(), s);
      } else if (normalized) {
        this.fallbackSellers.set(normalized, s);
      }
      return s;
    }
  }

  async deleteSeller(id) {
    await Seller.findByIdAndDelete(id);
  }

  async verifyEmail(email, otp) {
    const seller = await Seller.findOne({ email });
    if (!seller) throw new SellerError("Seller not found");
    seller.isEmailVerified = true;
    seller.accountStatus = AccountStatus.ACTIVE;
    return await seller.save();
  }

  async updateSellerAccountStatus(id, status) {
    const seller = await Seller.findById(id);
    if (!seller) throw new SellerError("Seller not found");
    seller.accountStatus = status;
    return await seller.save();
  }
}

module.exports = new SellerService();
