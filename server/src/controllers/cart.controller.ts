import { Response } from 'express';
import { type AuthRequest } from '../middleware/auth.middleware.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    let cart = await Cart.findOne({ userId }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    res.json({ cart });
  } catch (error) {
    console.error('getCart error:', error);
    res.status(500).json({ message: 'Failed to fetch cart.' });
  }
};

export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { productId, quantity } = req.body;

    if (!productId || typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ message: 'Product ID and valid quantity required.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = quantity;
    } else {
      cart.items.push({ product: productId as any, quantity });
    }

    await cart.save();
    const populated = await cart.populate('items.product');

    res.json({ cart: populated });
  } catch (error) {
    console.error('addToCart error:', error);
    res.status(500).json({ message: 'Failed to update cart.' });
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID required.' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found.' });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();
    const populated = await cart.populate('items.product');

    res.json({ cart: populated });
  } catch (error) {
    console.error('removeFromCart error:', error);
    res.status(500).json({ message: 'Failed to remove item.' });
  }
};

export const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    let cart = await Cart.findOne({ userId });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({ success: true, message: 'Cart cleared.' });
  } catch (error) {
    console.error('clearCart error:', error);
    res.status(500).json({ message: 'Failed to clear cart.' });
  }
};
