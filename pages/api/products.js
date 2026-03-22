import { getProducts } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category = null, limit = 50, offset = 0 } = req.query;
    const products = await getProducts(
      category || null,
      parseInt(limit),
      parseInt(offset)
    );

    // If no products from DB, return empty array
    if (!products || products.length === 0) {
      return res.status(200).json([]);
    }

    // Format products for frontend
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      rating: product.avg_rating || 0,
      reviews: product.review_count || 0,
      description: product.description,
      image_url: product.image_url,
    }));

    res.status(200).json(formattedProducts);
  } catch (error) {
    console.error('API Error:', error);
    // Return empty array on error instead of failing completely
    res.status(200).json([]);
  }
}
