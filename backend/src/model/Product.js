import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  mrpPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  discountPercentage: { type: Number, required: true },
  colour: { type: String, required: true },
  images:{type:[String], required:true},
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    required: true
  },
  size:{type:[String], required:false},

})

const Product = mongoose.model("Product", productSchema);

module.exports = Product;  // Registers a model named "Product" Internally creates a MongoDB collection: "products"