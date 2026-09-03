const mongoose = require('mongoose');
const { Schema } = mongoose;

const wishlistSchema = new Schema({
    user: { 
        type: Schema.Types.Mixed, 
        required: true 
    },
    products: [{
        type: Schema.Types.Mixed
    }]
}, { timestamps: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
