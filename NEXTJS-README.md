# TEKPIK — Next.js + React Application

A modern tech gadget review platform built with Next.js, React, and Vercel Postgres.

## Project Structure

```
├── api/                           # API routes
│   ├── newsletter.js             # Newsletter subscription
│   ├── products.js               # Product listing & creation
│   ├── products/[id].js          # Product details & URLs
│   ├── reviews.js                # Review submission
│   └── search.js                 # Product search
├── components/                    # React components
│   ├── Nav.jsx                   # Navigation bar
│   ├── Hero.jsx                  # Hero section
│   ├── Stats.jsx                 # Stats section
│   ├── ProductCard.jsx           # Product card
│   ├── Newsletter.jsx            # Newsletter form
│   └── Footer.jsx                # Footer
├── pages/                         # Next.js pages
│   ├── _app.jsx                  # App wrapper
│   ├── _document.jsx             # Document wrapper
│   ├── index.jsx                 # Home page
│   ├── reviews.jsx               # Reviews listing
│   ├── products/[id].jsx         # Product detail page
│   ├── categories/[slug].jsx     # Category page
│   └── 404.jsx                   # Not found page
├── styles/                        # CSS modules
│   ├── globals.css               # Global styles
│   ├── Nav.module.css
│   ├── Hero.module.css
│   ├── Home.module.css
│   └── ...
├── lib/                           # Utility functions
│   └── db.js                     # Database functions
├── public/                        # Static files
├── package.json
├── next.config.js
└── jsconfig.json
```

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Create `.env.local` with your Vercel Postgres credentials:

```
POSTGRES_URL="postgresql://..."
POSTGRES_URLUNENCODED="postgresql://..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_USER="..."
POSTGRES_DATABASE="verceldb"
```

Get these from [Vercel Dashboard](https://vercel.com/dashboard) → Storage → Postgres

### 3. Initialize Database

Run the SQL schema from `db-schema.sql` in Vercel Postgres console:

```sql
-- Copy contents of db-schema.sql and run in Vercel Postgres
```

Or use the psql CLI:

```bash
psql $POSTGRES_URL < db-schema.sql
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

### Home Page (`/`)
- Hero section with featured products
- Stats showcase (200+ reviews, 50K+ readers, etc.)
- Featured reviews grid
- Product categories
- Newsletter signup

### Reviews Page (`/reviews`)
- All products/reviews in a grid layout
- Filterable by category, rating, price

### Product Detail Page (`/products/[id]`)
- Full product information
- Specifications
- All store links (Amazon, Flipkart, etc.)
- Customer reviews
- Ratings and verdicts

### Category Page (`/categories/[slug]`)
- Category-specific product grid
- Filter and sort options
- Category description and icon

## API Endpoints

### `GET /api/products`
Fetch all products with optional filtering

**Query Parameters:**
- `category` - Filter by category
- `limit` - Items per page (default: 20)
- `offset` - Pagination offset (default: 0)

**Example:**
```javascript
const res = await fetch('/api/products?category=Earphones&limit=10');
const products = await res.json();
```

### `GET /api/products/[id]`
Fetch single product with all details (URLs, reviews, ratings)

**Example:**
```javascript
const res = await fetch('/api/products/1');
const product = await res.json();
```

### `POST /api/products`
Create new product (admin only)

**Body:**
```json
{
  "name": "Sony WF-C700N",
  "category": "Earphones",
  "price": 9999,
  "image_url": "https://...",
  "description": "Best budget earphones",
  "specs": { "driver": "5.9mm", "battery": "8h" }
}
```

### `POST /api/products/[id]`
Add product store link (affiliate/comparison URL)

**Body:**
```json
{
  "store_name": "Amazon",
  "url": "https://amazon.in/...",
  "price": 9999,
  "affiliate_link": true
}
```

### `POST /api/reviews`
Submit product review

**Body:**
```json
{
  "product_id": 1,
  "title": "Great sound quality",
  "content": "Detailed review...",
  "rating": 4.5,
  "author": "TekPik",
  "pros": "Good sound, long battery",
  "cons": "Average mic quality",
  "verdict": "Best under ₹10,000"
}
```

### `POST /api/newsletter`
Subscribe to newsletter

**Body:**
```json
{
  "email": "user@example.com"
}
```

### `GET /api/search`
Search products by name/description

**Query Parameters:**
- `q` - Search query (min 2 chars)
- `limit` - Results limit (default: 10)

**Example:**
```javascript
const res = await fetch('/api/search?q=earphones&limit=5');
```

## Components

### Nav
Navigation bar with links to Reviews, Categories, Deals, and newsletter signup

### Hero
Hero section with headline, CTA buttons, and featured product cards

### Stats
Statistics showcase (products reviewed, monthly readers, etc.)

### ProductCard
Reusable product card component with rating, price, and category tag

### Newsletter
Newsletter subscription form with email validation

### Footer
Footer with links and copyright

## Database Schema

See [db-schema.sql](../db-schema.sql) for detailed schema documentation

### Main Tables:
- `products` - Product information
- `product_urls` - Store links (Amazon, Flipkart, etc.)
- `reviews` - Customer reviews
- `categories` - Product categories
- `newsletter_subscribers` - Email list
- `product_ratings` - Cached ratings for performance

## Development

### Build for Production

```bash
npm run build
npm run start
```

### Deployment

Deploy to Vercel:

```bash
vercel deploy
```

The app will automatically:
1. Build and optimize
2. Connect to your Vercel Postgres database
3. Generate static pages for better performance

## Features

✅ **Next.js App Router** - File-based routing  
✅ **React Components** - Reusable UI components  
✅ **Static Site Generation (SSG)** - Pre-built pages for speed  
✅ **Server-Side Rendering (SSR)** - Dynamic content  
✅ **CSS Modules** - Scoped styling  
✅ **Responsive Design** - Mobile-first approach  
✅ **Vercel Postgres** - Scalable database  
✅ **API Routes** - Serverless backend  
✅ **SEO Optimized** - Meta tags, structured data  
✅ **Newsletter Integration** - Email subscription  

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_URL` | Yes | Full PostgreSQL connection string |
| `POSTGRES_HOST` | Yes | Database host |
| `POSTGRES_PASSWORD` | Yes | Database password |
| `POSTGRES_USER` | Yes | Database user |
| `POSTGRES_DATABASE` | Yes | Database name |

## Performance Optimizations

- **Image Optimization** - Next.js Image component with lazy loading
- **Code Splitting** - Automatic code splitting per page
- **Static Generation** - Pages pre-rendered at build time
- **Database Indexing** - Optimized queries with indexes
- **Caching** - ISR (Incremental Static Regeneration) for dynamic updates

## Security

- ✅ Environment variables for sensitive data
- ✅ Input validation on all API endpoints
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS headers for API protection
- ✅ Canonical URLs for SEO and security

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Support

For issues or questions, open an issue on GitHub or contact support.
