const mongoose = require('mongoose');
const UserRoles = require('../domain/UserRole');
const AccountStatus = require('../domain/AccountStatus');

// Define the Seller (Merchant) schema
const sellerSchema = new mongoose.Schema({
    sellerName: {
        type: String,
        required: true,
        trim: true,
    },
    mobile: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        select: false  
    },
    accountType: {
        type: String,
        default: 'SELLER',
        immutable: true,
    },
    businessDetails: {
        businessName: {
            type: String,
            required: true,
            trim: true,
        },
        businessEmail: {
            type: String,
            trim: true,
        },
        businessMobile: {
            type: String,
            trim: true,
        },
        businessAddress: {
            type: String,
            trim: true,
        },
        logo: {
            type: String
        },
        banner: {
            type: String
        }
    },
    bankDetails: {
        accountNumber: {
            type: String,
            required: true,
        },
        accountHolderName: {
            type: String,
            required: true,
        },
        ifscCode: {
            type: String,
            required: true,
        }
    },
    pickupAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'  
    },
    GSTIN: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        default: UserRoles.SELLER,
        immutable: true,
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    accountStatus: {
        type: String,
        enum: [
            AccountStatus.PENDING_VERIFICATION, 
            AccountStatus.ACTIVE, 
            AccountStatus.SUSPENDED, 
            AccountStatus.DEACTIVATED, 
            AccountStatus.BANNED, 
            AccountStatus.CLOSED
        ],  
        default: AccountStatus.PENDING_VERIFICATION
    }
}, {
    timestamps: true  
});

const Seller = mongoose.model('Seller', sellerSchema);

module.exports = Seller;
