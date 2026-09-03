const CartService = require("../services/CartService");
const UserService = require("../services/UserService");
const ProductService = require("../services/ProductService");
const CartItemService = require("../services/CartItemService");
// const CartItemService = require("../services/CartItemService");

class CartController {
  async findUserCartHandler(req, res) {
    try {
      const user = await req.user;


      const cart = await CartService.findUserCart(user);

      res.status(200).json(cart);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Add item to cart
  async addItemToCart(req, res) {
    try {
      const user = await req.user;
    //   console.log("req ",req.body)
      const product = await ProductService.findProductById(req.body.productId);

      const cartItem = await CartService.addCartItem(
        user,
        product,
        req.body.size,
        req.body.quantity
      );

      res.status(202).json(cartItem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete a cart item
  async deleteCartItemHandler(req, res) {
    try {

      const user = await req.user;
      await CartItemService.removeCartItem(user._id, req.params.cartItemId);

      res.status(202).json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update a cart item
  async updateCartItemHandler(req, res) {
    try {
      const cartItemId = req.params.cartItemId;
      const { quantity } = req.body;

      const user = await req.user;
      let updatedCartItem;
      if (quantity > 0) {
        updatedCartItem = await CartItemService.updateCartItem(
          user._id,
          cartItemId,
          { quantity }
        );
      }

      res.status(202).json(updatedCartItem);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new CartController();
