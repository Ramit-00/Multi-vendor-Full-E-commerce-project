const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartSchema = new Schema({
    user: { 
        type: Schema.Types.Mixed, 
        required: true 
    },
    cartItems: [{ 
        type: Schema.Types.Mixed 
    }],
    totalSellingPrice: { 
        type: Number, 
        default: 0
    },
    totalItem: { 
        type: Number, 
        default: 0 
    },
    totalMrpPrice: { 
        type: Number, 
        default: 0 
    },
    discount: { 
        type: Number, 
        default: 0 
    },
    couponCode: { 
        type: String, 
        default: null 
    },
    couponPrice: { 
        type: Number, 
        default: 0 
    },
}, { timestamps: true });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
