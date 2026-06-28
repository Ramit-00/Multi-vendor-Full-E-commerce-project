import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String},
  categoryId:{ type: String, unique:true, required:true},
  parentCategory: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null 
  },
  level: { type: Number, required: true},

},{timestamps:true} )   // It will automatically create createdAt and updatedAt fields

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;  // Registers a model named "Category" Internally creates a MongoDB collection: "categories"