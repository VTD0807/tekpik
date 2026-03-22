import { searchProducts } from '../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({ error: 'Query must be at least 2 characters' });
      }

      const results = await searchProducts(q, parseInt(limit));
      res.status(200).json(results);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
