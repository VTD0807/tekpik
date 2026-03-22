# TekPik Database Setup

## Database: Vercel Postgres

### Quick Start

1. **Connect to Vercel Postgres**
   ```bash
   npm install @vercel/postgres
   ```

2. **Add environment variables** to `.env.local`:
   ```
   POSTGRES_URL="postgresql://..."
   POSTGRES_URLUNENCODED="postgresql://..."
   POSTGRES_HOST="..."
   POSTGRES_PASSWORD="..."
   POSTGRES_USER="..."
   POSTGRES_DATABASE="verceldb"
   ```
   Get these from [Vercel Dashboard](https://vercel.com/dashboard) → Postgres

3. **Create database schema**
   Run the SQL from `db-schema.sql` in Vercel Postgres console

4. **Install dependencies**
   ```bash
   npm install @vercel/postgres
   ```

## Database Schema

### Tables

#### `products`
- Store gadget details (name, category, price, image, specs)
- `specs` is JSONB for flexible product attributes

#### `product_urls`
- Store multiple store links (Amazon, Flipkart, etc.)
- Track prices and stock status across different stores
- Support affiliate links

#### `reviews`
- Store product reviews (title, content, rating, pros/cons)
- Track published status and view count

#### `categories`
- Store product categories with descriptions
- Link to reviews count

#### `newsletter_subscribers`
- Store email subscribers for newsletter campaigns
- Track subscription status

#### `product_ratings`
- Cache average ratings and review counts for faster queries

## API Endpoints

### GET `/api/products`
Fetch all products with pagination and category filtering
```javascript
const res = await fetch('/api/products?category=Earphones&limit=20&offset=0');
const products = await res.json();
```

### GET `/api/products/[id]`
Get single product with all URLs and reviews
```javascript
const res = await fetch('/api/products/1');
const product = await res.json();
```

### POST `/api/products`
Add new product
```javascript
const res = await fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Sony WF-C700N',
    category: 'Earphones',
    price: 9999,
    image_url: 'https://...',
    description: 'Best budget earphones',
    specs: { driver: '5.9mm', battery: '8h' }
  })
});
```

### POST `/api/products/[id]`
Add/update product URL (Amazon, Flipkart, etc.)
```javascript
const res = await fetch('/api/products/1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    store_name: 'Amazon',
    url: 'https://amazon.in/...',
    price: 9999,
    affiliate_link: true
  })
});
```

### POST `/api/reviews`
Add product review
```javascript
const res = await fetch('/api/reviews', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    product_id: 1,
    title: 'Great sound, great price',
    content: 'Detailed review...',
    rating: 4.5,
    author: 'TekPik',
    pros: 'Good sound quality, long battery',
    cons: 'Average mic quality',
    verdict: 'Best under ₹10,000'
  })
});
```

### POST `/api/newsletter`
Subscribe email to newsletter
```javascript
const res = await fetch('/api/newsletter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});
```

### GET `/api/search`
Search products
```javascript
const res = await fetch('/api/search?q=earphones&limit=10');
const results = await res.json();
```

## Data Model Example

### Product with Multiple URLs
```javascript
{
  id: 1,
  name: 'Sony WF-C700N',
  category: 'Earphones',
  price: 9999,
  image_url: '...',
  avg_rating: 4.5,
  review_count: 24,
  urls: [
    {
      store_name: 'Amazon',
      url: 'https://amazon.in/...',
      price: 9999,
      in_stock: true
    },
    {
      store_name: 'Flipkart',
      url: 'https://flipkart.com/...',
      price: 9500,
      in_stock: true
    }
  ],
  reviews: [
    {
      id: 1,
      title: 'Great sound',
      rating: 4.5,
      content: '...',
      pros: '...',
      cons: '...',
      verdict: '...'
    }
  ]
}
```

## Integration with Frontend

Update `index.html` newsletter form to use API:
```javascript
document.querySelector('.newsletter-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.querySelector('#newsletter-email').value;
  
  const res = await fetch('/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  if (res.ok) {
    alert('Subscribed successfully!');
  }
});
```

## Next Steps

1. [Create Vercel Postgres database](https://vercel.com/docs/storage/postgres)
2. Run SQL schema from `db-schema.sql`
3. Add environment variables to `.env.local`
4. Test API endpoints
5. Deploy to Vercel
