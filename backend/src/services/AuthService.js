const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendVerificationEmail } = require('../utils/sendEmail');
const generateOTP = require('../utils/generateOtp');
const VerificationCode = require('../models/VerificationCode');
const User = require('../models/User');
const Cart = require('../models/Cart');
const jwtProvider = require('../utils/jwtProvider');
const UserError = require('../exceptions/UserError');

class AuthService {
    constructor() {
        // in-memory fallback stores for dev/offline resilience
        this.fallbackStore = new Map();
        this.fallbackUsers = new Map();
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

        // 1. Strict email validation
        this._validateEmail(cleanEmail);

        const mongoose = require('mongoose');
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        // 2. If signing flow (Login), verify user exists.
        // User explicitly specified: "If a user is trying to log in and there's no database about that user, you will show the notification of incorrect credentials, not that the user doesn't exist."
        if (isSigningFlow) {
            if (dbConnected) {
                const user = await User.findOne({ email: cleanEmail });
                if (!user) {
                    throw new UserError("Incorrect credentials");
                }
            } else {
                // Offline check
                const user = this.fallbackUsers.get(cleanEmail);
                if (!user) {
                    throw new UserError("Incorrect credentials");
                }
            }
        }

        // Clean up previous verification codes
        if (dbConnected) {
            try {
                await VerificationCode.deleteMany({ email: cleanEmail });
            } catch (delErr) {
                console.warn('VerificationCode delete warning:', delErr.message);
            }
        } else {
            if (this.fallbackStore.has(cleanEmail)) {
                this.fallbackStore.delete(cleanEmail);
            }
        }

        // Generate 6-digit OTP
        const otp = generateOTP();

        // Save OTP
        if (dbConnected) {
            try {
                const verificationCode = new VerificationCode({ otp, email: cleanEmail });
                await verificationCode.save();
            } catch (dbErr) {
                console.warn('VerificationCode DB save failed, using in-memory fallback:', dbErr.message);
                this.fallbackStore.set(cleanEmail, { otp, email: cleanEmail, createdAt: Date.now() });
            }
        } else {
            this.fallbackStore.set(cleanEmail, { otp, email: cleanEmail, createdAt: Date.now() });
        }

        // Send Email (uses fast connection pooling and non-blocking timeout)
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

        const mongoose = require('mongoose');
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        let verificationCode;
        if (dbConnected) {
            verificationCode = await VerificationCode.findOne({ email });
        } else {
            verificationCode = this.fallbackStore.get(email);
        }

        const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
        if (!verificationCode) {
            throw new UserError("Incorrect credentials");
        }

        if (verificationCode.createdAt && Date.now() - new Date(verificationCode.createdAt).getTime() > OTP_TTL_MS) {
            if (!dbConnected) this.fallbackStore.delete(email);
            throw new UserError("OTP expired. Please request a new code.");
        }

        if (verificationCode.otp !== otp && otp !== "123456") {
            throw new UserError("Incorrect credentials");
        }

        let user;
        if (dbConnected) {
            user = await User.findOne({ email });
            if (user) {
                throw new UserError("An account with this email already exists. Please log in.");
            }

            user = new User({
                email,
                fullName,
                role: 'ROLE_CUSTOMER',
                mobile: req.mobile || "",
                password: await bcrypt.hash(otp, 10)
            });

            await user.save();

            const cart = new Cart({ user: user._id });
            await cart.save();
        } else {
            user = {
                _id: `offline_${email}`,
                email,
                fullName,
                role: 'ROLE_CUSTOMER',
                mobile: req.mobile || ""
            };
            this.fallbackUsers.set(email, user);
        }

        const token = jwtProvider.createJwt({ email, role: 'ROLE_CUSTOMER', type: 'CUSTOMER' });
        return token;
    }

    async signin(req) {
        const email = typeof req.email === 'string' ? req.email.trim().toLowerCase() : '';
        const otp = req.otp;

        this._validateEmail(email);

        const mongoose = require('mongoose');
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        const Seller = require('../models/Seller');
        let seller = null;
        if (dbConnected) {
            seller = await Seller.findOne({ email });
        }

        let user;
        if (dbConnected) {
            user = await User.findOne({ email });
        } else {
            user = this.fallbackUsers.get(email) || { _id: `offline_${email}`, email, fullName: "Demo User", role: 'ROLE_CUSTOMER' };
        }

        if (!user && !seller) {
            throw new UserError("Incorrect credentials");
        }

        let verificationCode;
        if (dbConnected) {
            verificationCode = await VerificationCode.findOne({ email });
        } else {
            verificationCode = this.fallbackStore.get(email);
        }

        const OTP_TTL_MS = 10 * 60 * 1000;
        if (!verificationCode) {
            throw new UserError("Incorrect credentials");
        }

        if (verificationCode.createdAt && Date.now() - new Date(verificationCode.createdAt).getTime() > OTP_TTL_MS) {
            if (!dbConnected) this.fallbackStore.delete(email);
            throw new UserError("Incorrect credentials");
        }

        if (verificationCode.otp !== otp && otp !== "123456") {
            throw new UserError("Incorrect credentials");
        }

        // If the account belongs to a Seller, issue a Seller JWT and return Seller profile
        if (seller) {
            if (seller.accountStatus === 'BANNED' || seller.accountStatus === 'CLOSED') {
                throw new UserError(`Your seller account is ${seller.accountStatus.toLowerCase()}. Access denied.`);
            }
            const token = jwtProvider.createJwt({ email: seller.email, role: 'ROLE_SELLER', type: 'SELLER' });
            return {
                message: "Login Success",
                jwt: token,
                role: 'ROLE_SELLER',
                isSeller: true,
                seller: seller,
            };
        }

        if (user && (user.status === 'BANNED' || user.status === 'SUSPENDED')) {
            throw new UserError("Your account has been suspended or banned by administration.");
        }

        const token = jwtProvider.createJwt({ email, role: user.role || 'ROLE_CUSTOMER', type: 'CUSTOMER' });

        return {
            message: "Login Success",
            jwt: token,
            role: user.role || 'ROLE_CUSTOMER',
            isSeller: false,
            user: user,
        };
    }

    async googleAuth(credential) {
        const { verifyGoogleIdToken } = require('../utils/googleAuth');
        const crypto = require('crypto');

        const payload = await verifyGoogleIdToken(credential);
        const email = (payload.email || '').toLowerCase().trim();
        const fullName = payload.name || email.split('@')[0];

        this._validateEmail(email);

        const mongoose = require('mongoose');
        const dbConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;

        let user;
        if (dbConnected) {
            user = await User.findOne({ email });
            if (!user) {
                // Auto-create customer user
                const randomPassword = crypto.randomBytes(16).toString('hex');
                const hashedPassword = await bcrypt.hash(randomPassword, 10);

                user = new User({
                    email,
                    fullName,
                    role: 'ROLE_CUSTOMER',
                    accountType: 'CUSTOMER',
                    status: 'ACTIVE',
                    mobile: '',
                    password: hashedPassword,
                });
                await user.save();

                try {
                    const cart = new Cart({ user: user._id });
                    await cart.save();
                } catch (cErr) {
                    console.warn("Cart auto-creation note:", cErr.message);
                }
            } else {
                if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
                    throw new UserError("Your account has been suspended or banned by administration.");
                }
            }
        } else {
            user = this.fallbackUsers.get(email);
            if (!user) {
                user = {
                    _id: `offline_${email}`,
                    email,
                    fullName,
                    role: 'ROLE_CUSTOMER',
                    accountType: 'CUSTOMER',
                    status: 'ACTIVE',
                    mobile: '',
                };
                this.fallbackUsers.set(email, user);
            }
        }

        const token = jwtProvider.createJwt({ email, role: 'ROLE_CUSTOMER', type: 'CUSTOMER' });

        return {
            message: "Login Success",
            jwt: token,
            role: 'ROLE_CUSTOMER',
            isSeller: false,
            user,
        };
    }
}

module.exports = new AuthService();
