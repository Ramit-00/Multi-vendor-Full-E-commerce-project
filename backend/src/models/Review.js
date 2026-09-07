const mongoose = require('mongoose');

// Define the Review schema
const reviewSchema = new mongoose.Schema({
    reviewText: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    productImages: {
        type: [String],  
        default: []
    },
    product: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now  
    }
}, {
    timestamps: true  
});

// Indices for querying reviews by product or user
reviewSchema.index({ product: 1 });
reviewSchema.index({ user: 1 });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
