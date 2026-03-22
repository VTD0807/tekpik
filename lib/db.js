import { sql } from '@vercel/postgres';

// Get all products with their URLs and ratings
export async function getProducts(category = null, limit = 20, offset = 0) {
  try {
    let query = `
      SELECT 
        p.id, p.name, p.category, p.price, p.image_url, p.description,
        pr.avg_rating, pr.review_count,
        json_agg(json_build_object(
          'store_name', pu.store_name,
          'url', pu.url,
          'price', pu.price,
          'in_stock', pu.in_stock
        )) as urls
      FROM products p
      LEFT JOIN product_ratings pr ON p.id = pr.product_id
      LEFT JOIN product_urls pu ON p.id = pu.product_id
    `;
    
    if (category) {
      query += ` WHERE p.category = $1`;
    }
    
    query += ` GROUP BY p.id, pr.id ORDER BY pr.avg_rating DESC LIMIT $${category ? 2 : 1} OFFSET $${category ? 3 : 2}`;
    
    const params = category ? [category, limit, offset] : [limit, offset];
    const result = await sql.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
}

// Get single product with all details
export async function getProductById(productId) {
  try {
    const product = await sql`
      SELECT p.*, pr.avg_rating, pr.review_count
      FROM products p
      LEFT JOIN product_ratings pr ON p.id = pr.product_id
      WHERE p.id = ${productId}
    `;
    
    const urls = await sql`
      SELECT * FROM product_urls
      WHERE product_id = ${productId}
      ORDER BY updated_at DESC
    `;
    
    const reviews = await sql`
      SELECT * FROM reviews
      WHERE product_id = ${productId} AND published = true
      ORDER BY created_at DESC
    `;
    
    return {
      ...product.rows[0],
      urls: urls.rows,
      reviews: reviews.rows
    };
  } catch (error) {
    console.error('Failed to fetch product:', error);
    throw error;
  }
}

// Add a new product
export async function addProduct(productData) {
  try {
    const { name, category, price, image_url, description, specs } = productData;
    
    const result = await sql`
      INSERT INTO products (name, category, price, image_url, description, specs)
      VALUES (${name}, ${category}, ${price}, ${image_url}, ${description}, ${JSON.stringify(specs || {})})
      RETURNING *
    `;
    
    return result.rows[0];
  } catch (error) {
    console.error('Failed to add product:', error);
    throw error;
  }
}

// Add product URL (Amazon, Flipkart, etc.)
export async function addProductUrl(productId, urlData) {
  try {
    const { store_name, url, price, affiliate_link } = urlData;
    
    const result = await sql`
      INSERT INTO product_urls (product_id, store_name, url, price, affiliate_link)
      VALUES (${productId}, ${store_name}, ${url}, ${price}, ${affiliate_link || false})
      ON CONFLICT (product_id, store_name) 
      DO UPDATE SET url = EXCLUDED.url, price = EXCLUDED.price, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    return result.rows[0];
  } catch (error) {
    console.error('Failed to add product URL:', error);
    throw error;
  }
}

// Add a review
export async function addReview(productId, reviewData) {
  try {
    const { title, content, rating, author, pros, cons, verdict } = reviewData;
    
    const result = await sql`
      INSERT INTO reviews (product_id, title, content, rating, author, pros, cons, verdict, published)
      VALUES (${productId}, ${title}, ${content}, ${rating}, ${author}, ${pros}, ${cons}, ${verdict}, true)
      RETURNING *
    `;
    
    // Update product ratings
    await updateProductRating(productId);
    
    return result.rows[0];
  } catch (error) {
    console.error('Failed to add review:', error);
    throw error;
  }
}

// Update product rating average
export async function updateProductRating(productId) {
  try {
    const ratingData = await sql`
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
      FROM reviews
      WHERE product_id = ${productId} AND published = true
    `;
    
    const { avg_rating, review_count } = ratingData.rows[0];
    
    await sql`
      INSERT INTO product_ratings (product_id, avg_rating, review_count)
      VALUES (${productId}, ${avg_rating}, ${review_count})
      ON CONFLICT (product_id)
      DO UPDATE SET avg_rating = EXCLUDED.avg_rating, review_count = EXCLUDED.review_count
    `;
  } catch (error) {
    console.error('Failed to update product rating:', error);
    throw error;
  }
}

// Subscribe to newsletter
export async function subscribeNewsletter(email) {
  try {
    const result = await sql`
      INSERT INTO newsletter_subscribers (email, subscribed)
      VALUES (${email}, true)
      ON CONFLICT (email)
      DO UPDATE SET subscribed = true, unsubscribed_at = NULL
      RETURNING *
    `;
    
    return result.rows[0];
  } catch (error) {
    console.error('Failed to subscribe:', error);
    throw error;
  }
}

// Get categories
export async function getCategories() {
  try {
    const result = await sql`
      SELECT id, name, slug, description, icon
      FROM categories
      ORDER BY name
    `;
    
    return result.rows;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
}

// Search products by name/description
export async function searchProducts(query, limit = 10) {
  try {
    const result = await sql`
      SELECT 
        p.id, p.name, p.category, p.price, p.image_url,
        pr.avg_rating, pr.review_count
      FROM products p
      LEFT JOIN product_ratings pr ON p.id = pr.product_id
      WHERE p.name ILIKE ${'%' + query + '%'} 
         OR p.description ILIKE ${'%' + query + '%'}
      ORDER BY pr.avg_rating DESC
      LIMIT ${limit}
    `;
    
    return result.rows;
  } catch (error) {
    console.error('Failed to search products:', error);
    throw error;
  }
}
