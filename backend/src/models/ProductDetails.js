const mongoose = require('mongoose');
const { Schema } = mongoose;

const productDetailsSchema = new Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  description: {
    type: String,
    default: '',
  },
  images: [{
    type: String,
  }],
  attributes: {
    color: { type: String, default: '' },
    sizes: { type: String, default: '' },
    discountPercent: { type: Number, default: 0 },
    mrpPrice: { type: Number, default: 0 },
  },
  specs: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
  collection: 'productdetails',
});

const ProductDetails = mongoose.model('ProductDetails', productDetailsSchema);

module.exports = ProductDetails;
