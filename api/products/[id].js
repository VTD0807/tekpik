import { getProductById, addProductUrl } from '../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const product = await getProductById(parseInt(id));
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.status(200).json(product);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  } else if (req.method === 'POST') {
    // Add URL to product
    try {
      const url = await addProductUrl(parseInt(id), req.body);
      res.status(201).json(url);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Failed to add product URL' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
