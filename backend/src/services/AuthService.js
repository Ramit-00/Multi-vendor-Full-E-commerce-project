const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const prisma = require('../config/prisma');
const { sendVerificationEmail } = require('../utils/sendEmail');
const generateOTP = require('../utils/generateOtp');
const VerificationCode = require('../models/VerificationCode');
const Cart = require('../models/Cart');
const jwtProvider = require('../utils/jwtProvider');
const UserError = require('../exceptions/UserError');

const OFFLINE_CACHE_FILE = path.join(__dirname, '..', '..', '.offline_cache.json');

function formatDefaultName(email) {
  if (!email) return 'User';
  const namePart = email.split('@')[0].replace(/[0-9._-]+/g, ' ').trim();
  if (!namePart) return 'User';
  return namePart.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function toAppRole(prismaRole) {
  if (prismaRole === 'ADMIN') return 'ROLE_ADMIN';
  if (prismaRole === 'SELLER') return 'ROLE_SELLER';
  return 'ROLE_CUSTOMER';
}

function formatUserForResponse(user) {
  if (!user) return null;
  return {
    id: user.id,
    _id: user.id,
    name: user.name,
    fullName: user.name,
    email: user.email,
    mobile: user.phone || '',
    phone: user.phone || '',
    role: toAppRole(user.role),
    accountType: user.role === 'ADMIN' ? 'ADMIN' : (user.role === 'SELLER' ? 'SELLER' : 'CUSTOMER'),
    status: 'ACTIVE',
    addresses: (user.addresses || []).map(a => ({
      id: a.id,
      _id: a.id,
      userId: a.userId,
      address: a.line1,
      line1: a.line1,
      locality: a.line2 || '',
      line2: a.line2 || '',
      city: a.city,
      state: a.state,
      pinCode: a.pincode,
      pincode: a.pincode,
      isDefault: a.isDefault || false,
    })),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

class AuthService {
  constructor() {
    this.fallbackStore = new Map();
    this.fallbackUsers = new Map();
    this._loadOfflineCache();
  }

  _loadOfflineCache() {
    try {
      if (fs.existsSync(OFFLINE_CACHE_FILE)) {
        const raw = fs.readFileSync(OFFLINE_CACHE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          for (const [key, val] of Object.entries(data)) {
            this.fallbackUsers.set(key.toLowerCase().trim(), val);
          }
          console.log(`[AuthService] Loaded ${this.fallbackUsers.size} user profile(s) from offline disk cache`);
        }
      }
    } catch (e) {
      console.warn('[AuthService] Could not read .offline_cache.json:', e.message);
    }
  }

  _saveOfflineCache() {
    try {
      const obj = {};
      for (const [key, val] of this.fallbackUsers.entries()) {
        obj[key] = val;
      }
      fs.writeFileSync(OFFLINE_CACHE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[AuthService] Could not save .offline_cache.json:', e.message);
    }
  }

  setFallbackUser(email, user) {
    if (!email) return;
    const key = email.toLowerCase().trim();
    this.fallbackUsers.set(key, user);
    this._saveOfflineCache();
  }

  getFallbackUser(email) {
    if (!email) return null;
    const key = email.toLowerCase().trim();
    return this.fallbackUsers.get(key) || null;
  }

  formatDefaultName(email) {
    return formatDefaultName(email);
  }

  _validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      throw new UserError("Please enter a valid email address");
    }
  }

  async sendLoginOtp(email) {
    const SIGNING_PREFIX = "signing_";
    const isSigningFlow = typeof email === 'string' && email.startsWith(SIGNING_PREFIX);
    const cleanEmail = isSigningFlow
      ? email.substring(SIGNING_PREFIX.length).trim().toLowerCase()
      : (typeof email === 'string' ? email.trim().toLowerCase() : '');

    this._validateEmail(cleanEmail);

    // If signing flow (Login), verify user or seller exists in PostgreSQL
    if (isSigningFlow) {
      let existingUser = null;
      try {
        existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      } catch (dbErr) {
        console.warn('[AuthService] DB check warning in sendLoginOtp:', dbErr.message);
        existingUser = this.fallbackUsers.get(cleanEmail);
      }

      if (!existingUser) {
        throw new UserError("Incorrect credentials");
      }
    }

    // Clean up previous verification codes
    try {
      await VerificationCode.deleteMany({ email: cleanEmail });
    } catch (delErr) {
      if (this.fallbackStore.has(cleanEmail)) {
        this.fallbackStore.delete(cleanEmail);
      }
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Save OTP
    try {
      const verificationCode = new VerificationCode({ otp, email: cleanEmail });
      await verificationCode.save();
    } catch (dbErr) {
      this.fallbackStore.set(cleanEmail, { otp, email: cleanEmail, createdAt: Date.now() });
    }

    // Send Email
    const subject = "Your E-COM Verification Code";
    const text = `Your verification code is: ${otp}. It will expire in 10 minutes. Do not share this code with anyone.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px;">
        <h2 style="color: #1E40AF; margin-bottom: 12px;">E-COM Verification</h2>
        <p style="color: #475569; font-size: 15px;">Use the verification code below to complete your login or registration:</p>
        <div style="background-color: #EFF6FF; border: 2px dashed #3B82F6; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1E40AF;">${otp}</span>
        </div>
        <p style="color: #94A3B8; font-size: 12px;">This code expires in 10 minutes. If you did not request this code, please ignore this email.</p>
      </div>
    `;

    let mailSent = false;
    let previewUrl = null;
    let usedTestAccount = false;
    try {
      const sendResult = await sendVerificationEmail(cleanEmail, subject, text, { html, otp });
      if (sendResult) {
        mailSent = !!sendResult.mailSent;
        previewUrl = sendResult.previewUrl || null;
        usedTestAccount = !!sendResult.usedTestAccount;
      }
    } catch (mailErr) {
      console.warn('sendVerificationEmail error:', mailErr && mailErr.message);
      mailSent = false;
    }

    return { otp, mailSent, previewUrl, usedTestAccount };
  }

  async createUser(req) {
    const email = typeof req.email === 'string' ? req.email.trim().toLowerCase() : '';
    const fullName = req.fullName || '';
    const otp = req.otp;

    this._validateEmail(email);

    let verificationCode;
    try {
      verificationCode = await VerificationCode.findOne({ email });
    } catch (e) {
      verificationCode = this.fallbackStore.get(email);
    }
    if (!verificationCode) {
      verificationCode = this.fallbackStore.get(email);
    }

    const OTP_TTL_MS = 10 * 60 * 1000;
    if (!verificationCode) {
      throw new UserError("Incorrect credentials");
    }

    if (verificationCode.createdAt && Date.now() - new Date(verificationCode.createdAt).getTime() > OTP_TTL_MS) {
      this.fallbackStore.delete(email);
      throw new UserError("OTP expired. Please request a new code.");
    }

    if (verificationCode.otp !== otp) {
      throw new UserError("Incorrect credentials");
    }

    // Check if user already exists in PostgreSQL
    let existing = null;
    try {
      existing = await prisma.user.findUnique({ where: { email } });
    } catch (e) {
      existing = this.getFallbackUser(email);
    }

    if (existing) {
      throw new UserError("An account with this email already exists. Please log in.");
    }

    const randomSecret = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(randomSecret, 10);
    const createdUser = await prisma.user.create({
      data: {
        email,
        name: fullName || formatDefaultName(email),
        role: 'BUYER',
        phone: req.mobile || null,
        passwordHash,
      },
      include: { addresses: true },
    });

    // Create shopping cart in MongoDB
    try {
      const cart = new Cart({ user: createdUser.id });
      await cart.save();
    } catch (cartErr) {
      console.warn('[AuthService] Cart creation notice:', cartErr.message);
    }

    const formatted = formatUserForResponse(createdUser);
    this.setFallbackUser(email, formatted);

    const token = jwtProvider.createJwt({ email, role: 'ROLE_CUSTOMER', type: 'CUSTOMER' });
    return token;
  }

  async signin(req) {
    const email = typeof req.email === 'string' ? req.email.trim().toLowerCase() : '';
    const otp = req.otp;

    this._validateEmail(email);

    // 1. Check user and seller in PostgreSQL
    let user = null;
    let seller = null;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: { addresses: true, seller: true },
      });
      if (user && user.seller) {
        seller = user.seller;
      } else if (!user) {
        // Check if there's a seller with this email through user relation
        const possibleSeller = await prisma.seller.findFirst({
          where: { user: { email } },
          include: { user: true },
        });
        if (possibleSeller) {
          seller = possibleSeller;
          user = possibleSeller.user;
        }
      }
    } catch (dbErr) {
      console.warn('[AuthService] DB check warning in signin:', dbErr.message);
      user = this.getFallbackUser(email);
    }

    if (!user && !seller) {
      user = this.getFallbackUser(email);
    }

    if (!user && !seller) {
      throw new UserError("Incorrect credentials");
    }

    // 2. Validate OTP
    let verificationCode;
    try {
      verificationCode = await VerificationCode.findOne({ email });
    } catch (e) {
      verificationCode = this.fallbackStore.get(email);
    }
    if (!verificationCode) {
      verificationCode = this.fallbackStore.get(email);
    }

    const OTP_TTL_MS = 10 * 60 * 1000;
    if (!verificationCode) {
      throw new UserError("Incorrect credentials");
    }

    if (verificationCode.createdAt && Date.now() - new Date(verificationCode.createdAt).getTime() > OTP_TTL_MS) {
      this.fallbackStore.delete(email);
      throw new UserError("Incorrect credentials");
    }

    if (verificationCode.otp !== otp) {
      throw new UserError("Incorrect credentials");
    }

    // If Seller account
    if (seller || (user && user.role === 'SELLER')) {
      const sellerObj = seller || user.seller;
      const formattedSeller = {
        id: sellerObj?.id || user.id,
        _id: sellerObj?.id || user.id,
        sellerName: sellerObj?.storeName || user.name,
        email: user.email,
        mobile: user.phone || '',
        role: 'ROLE_SELLER',
        businessDetails: sellerObj?.payoutAccountInfo?.businessDetails || {},
        bankDetails: sellerObj?.payoutAccountInfo?.bankDetails || {},
        verificationStatus: sellerObj?.verificationStatus || 'active',
      };

      const token = jwtProvider.createJwt({ email: user.email, role: 'ROLE_SELLER', type: 'SELLER' });
      return {
        message: "Login Success",
        jwt: token,
        role: 'ROLE_SELLER',
        isSeller: true,
        seller: formattedSeller,
      };
    }

    const formattedUser = formatUserForResponse(user);
    this.setFallbackUser(email, formattedUser);

    const token = jwtProvider.createJwt({
      email,
      role: formattedUser.role || 'ROLE_CUSTOMER',
      type: 'CUSTOMER',
    });

    return {
      message: "Login Success",
      jwt: token,
      role: formattedUser.role || 'ROLE_CUSTOMER',
      isSeller: false,
      user: formattedUser,
    };
  }

  async googleAuth(credential) {
    const { verifyGoogleIdToken } = require('../utils/googleAuth');
    const payload = await verifyGoogleIdToken(credential);
    const email = (payload.email || '').toLowerCase().trim();
    const fullName = payload.name || email.split('@')[0];

    this._validateEmail(email);

    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: { addresses: true, seller: true },
      });

      if (!user) {
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = await prisma.user.create({
          data: {
            email,
            name: fullName,
            passwordHash: hashedPassword,
            role: 'BUYER',
          },
          include: { addresses: true, seller: true },
        });

        try {
          const cart = new Cart({ user: user.id });
          await cart.save();
        } catch (cErr) {
          console.warn("Cart auto-creation note:", cErr.message);
        }
      }
    } catch (err) {
      console.warn('[AuthService] googleAuth DB note:', err.message);
      user = this.getFallbackUser(email);
      if (!user) {
        user = {
          id: `offline_${email}`,
          _id: `offline_${email}`,
          email,
          name: fullName,
          role: 'BUYER',
          addresses: [],
        };
      }
    }

    const formatted = formatUserForResponse(user);
    this.setFallbackUser(email, formatted);

    const token = jwtProvider.createJwt({ email, role: 'ROLE_CUSTOMER', type: 'CUSTOMER' });

    return {
      message: "Login Success",
      jwt: token,
      role: 'ROLE_CUSTOMER',
      isSeller: false,
      user: formatted,
    };
  }
}

module.exports = new AuthService();
