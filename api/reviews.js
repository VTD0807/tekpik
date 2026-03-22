import { addReview } from '../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { product_id, ...reviewData } = req.body;
      const review = await addReview(parseInt(product_id), reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Failed to add review' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
