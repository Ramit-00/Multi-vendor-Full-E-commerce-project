const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartItemSchema = new Schema({
    cart: { 
        type: Schema.Types.Mixed, 
        required: true 
    },
    product: { 
        type: Schema.Types.Mixed, 
        required: true 
    },
    size: { 
        type: String, 
        default: 'FREE' 
    },
    quantity: { 
        type: Number, 
        default: 1 
    },
    mrpPrice: { 
        type: Number, 
        default: 0,
        required: true 
    },
    sellingPrice: { 
        type: Number,
        default: 0,
        required: true 
    },
    userId: { 
        type: Schema.Types.Mixed, 
        required: true 
    }
}, { timestamps: true });

const CartItem = mongoose.model('CartItem', cartItemSchema);

module.exports = CartItem;
