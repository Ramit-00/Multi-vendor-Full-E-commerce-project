

const calculateDiscountedPercentage = (mrpPrice, sellingPrice) => {
  if(mrpPrice <= 0 || sellingPrice < 0 ) {
    throw new Error('Invalid prices provided');
  }
  const discount = ((mrpPrice - sellingPrice) / mrpPrice) * 100;
  return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

class ProductService {
  async createProduct(req, seller) {

    try{
      const discountPercentage = calculateDiscountedPercentage(req.mrpPrice, req.sellingPrice);

      const category1 = await this.createOrGetCategory(req.category1, 1);
      const category2 = await this.createOrGetCategory(req.category2, 2, category1._id);
      const category3 = await this.createOrGetCategory(req.category3, 3, category2._id);
      
      const product = new Product({
        title: req.title,
        description: req.description,
        images: req.images,
        mrpPrice: req.mrpPrice,
        sellingPrice: req.sellingPrice,
        discountPercentage,
        size: req.size,
        seller: seller._id,
        categories: [category3._id],
      });

      return await product.save();

    } catch(error){
      throw new Error(`Error creating product: ${error.message}`);
    }

  }

  async createOrGetCategory(categoryId, level, parent = null) {

    let category = await Category.findOne({categoryId});

    if(!category){
      category = new Category({categoryId, level, parentCategory: parentId});
      
      category = await category.save();
    }
    return category;

  }

  async deleteProduct(productId){
    try{
      await Product.findByIdAndDelete(productId);
      return { message: 'Product deleted successfully' };
    } catch(error){
      throw new Error(`Error deleting product: ${error.message}`);
    }
  }

  async updateProduct(productId, updateProductData){
    try{
      const product = await Product.findByIdAndUpdate(productId, updateProductData, { new: true });
      if(!product){
        throw new Error('Product not found');
      }
      return product;
    } catch(error){
      throw new Error(`Error updating product: ${error.message}`);
    }
  }

  async findProductById(productId){
    try{
      const product = await Product.findOne(productId);

      if(!product){
        throw new Error("Product not found")
      }
      return product;
    }catch (error){
      throw new Error(error.message)
    }
  }

  async searchProduct(query){
    
    try{
      const products = await Product.find({title: new RegExp(query, "i")}) //The "i" flag means ignore case.
      return products;

    }catch (error){
      throw new Error(error.message)
    }
  }

  async getProductsBySellerId(sellerId){
    return await Products.find({seller:seller_id})
  }

  async getAllProducts(req){
    filterQuery = {};

    if()
  }

}