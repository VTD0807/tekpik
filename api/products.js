import { getProducts, getProductById, addProduct, addProductUrl } from '../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { category, limit = 20, offset = 0 } = req.query;
      const products = await getProducts(category, parseInt(limit), parseInt(offset));
      res.status(200).json(products);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  } else if (req.method === 'POST') {
    try {
      const product = await addProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Failed to add product' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
