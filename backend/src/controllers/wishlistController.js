const WishlistService = require("../services/WishllistService");
const UserService = require("../services/UserService");
const ProductService = require("../services/ProductService");

class WishlistController {
  // Get wishlist by user ID
  async getWishlistByUserId(req, res) {
    try {
      const user = await req.user;
      const wishlist = await WishlistService.getWishlistByUserId(user);
      return res.status(200).json(wishlist);
    } catch (error) {
      return res
        .status(500)
        .json({ message: `Error fetching wishlist: ${error.message}` });
    }
  }

  // Add or remove a product from the wishlist
  async addProductToWishlist(req, res) {
    try {
      const { productId } = req.params;

      const user = await req.user;
      const product = await ProductService.findProductById(productId);
      const updatedWishlist = await WishlistService.addProductToWishlist(
        user,
        product
      );
      return res.status(200).json(updatedWishlist);
    } catch (error) {
      return res
        .status(500)
        .json({ message: `Error updating wishlist: ${error.message}` });
    }
  }
}

module.exports = new WishlistController();
