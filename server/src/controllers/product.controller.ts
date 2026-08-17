import { Request, Response } from 'express';
import Product from '../models/Product.js';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, query } = req.query;
    const filter: Record<string, any> = {};

    if (category) {
      filter.category = category;
    }

    if (query) {
      filter.name = { $regex: new RegExp(query as string, 'i') };
    }

    const products = await Product.find(filter).lean();
    res.json({ products });
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json({ product });
  } catch (error) {
    console.error('getProductById error:', error);
    res.status(500).json({ message: 'Failed to fetch product details.' });
  }
};
