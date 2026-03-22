import { subscribeNewsletter } from '../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email required' });
      }

      const subscriber = await subscribeNewsletter(email);
      res.status(201).json({
        message: 'Successfully subscribed',
        email: subscriber.email
      });
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Failed to subscribe' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
