const mongoose = require('mongoose');
const { Schema } = mongoose;

const verificationCodeSchema = new Schema({
    otp: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true 
    },
    user: { 
        type: Schema.Types.Mixed, 
    },
    seller: { 
        type: Schema.Types.Mixed, 
    }
}, { timestamps: true });

// TTL index to automatically expire OTP records after 10 minutes (600 seconds)
verificationCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema);

module.exports = VerificationCode;
