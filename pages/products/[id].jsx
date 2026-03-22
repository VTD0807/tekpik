import Head from 'next/head';
import Link from 'next/link';
import { getProductById } from '@/lib/db';
import styles from '@/styles/ProductDetail.module.css';

export default function ProductDetail({ product }) {
  if (!product) {
    return (
      <main id="main-content" className={styles.main}>
        <div className={styles.notFound}>
          <h1>Product not found</h1>
          <Link href="/">← Back to home</Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{product.name} | TekPik - Tech Reviews India</title>
        <meta name="description" content={product.description} />
      </Head>
      <main id="main-content" className={styles.main}>
        <div className={styles.container}>
          <Link href="/" className={styles.backLink}>← Back to reviews</Link>

          <div className={styles.productGrid}>
            {/* Product Info */}
            <div className={styles.productInfo}>
              <div className={styles.category}>{product.category}</div>
              <h1>{product.name}</h1>
              <div className={styles.rating}>
                <span className={styles.star}>★ {product.avg_rating || 'N/A'}</span>
                <span className={styles.reviews}>({product.review_count || 0} reviews)</span>
              </div>
              <div className={styles.price}>₹{product.price}</div>
              <p className={styles.description}>{product.description}</p>

              {/* Specs */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className={styles.specs}>
                  <h3>Specifications</h3>
                  <ul>
                    {Object.entries(product.specs).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong> {value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Where to Buy */}
              {product.urls && product.urls.length > 0 && (
                <div className={styles.buySection}>
                  <h3>Where to Buy</h3>
                  <div className={styles.storeLinks}>
                    {product.urls.map((url, i) => (
                      <a
                        key={i}
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.storeBtn}
                      >
                        <span>{url.store_name}</span>
                        <span className={styles.price}>₹{url.price}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className={styles.reviewsSection}>
              <h2>Reviews</h2>
              {product.reviews && product.reviews.length > 0 ? (
                <div className={styles.reviewsList}>
                  {product.reviews.map((review) => (
                    <div key={review.id} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <h4>{review.title}</h4>
                        <span className={styles.reviewRating}>★ {review.rating}</span>
                      </div>
                      <p className={styles.reviewContent}>{review.content}</p>
                      {review.pros && (
                        <div className={styles.reviewPros}>
                          <strong>Pros:</strong> {review.pros}
                        </div>
                      )}
                      {review.cons && (
                        <div className={styles.reviewCons}>
                          <strong>Cons:</strong> {review.cons}
                        </div>
                      )}
                      {review.verdict && (
                        <div className={styles.reviewVerdict}>
                          <strong>Verdict:</strong> {review.verdict}
                        </div>
                      )}
                      <small className={styles.reviewMeta}>
                        By {review.author || 'Anonymous'} • {new Date(review.created_at).toLocaleDateString('en-IN')}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noReviews}>No reviews yet. Check back soon!</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export async function getStaticProps({ params }) {
  try {
    const product = await getProductById(parseInt(params.id));
    if (!product) {
      return { notFound: true };
    }
    return {
      props: { product },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return { notFound: true };
  }
}

export async function getStaticPaths() {
  // Generate paths for popular products on build time
  // In production, use fallback: 'blocking' for on-demand generation
  return {
    paths: [],
    fallback: 'blocking',
  };
}
