import Head from 'next/head';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/db';
import styles from '@/styles/Reviews.module.css';

export default function Reviews({ products }) {
  return (
    <>
      <Head>
        <title>Reviews | TekPik - Tech Gadget Reviews India</title>
        <meta name="description" content="Browse all tech gadget reviews on TekPik. Find honest reviews and expert recommendations for Indian buyers." />
      </Head>
      <main id="main-content" className={styles.main}>
        <div className={styles.container}>
          <Link href="/" className={styles.backLink}>← Back to home</Link>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h1>All Reviews</h1>
                <p className={styles.subtitle}>Honest reviews and expert buying guides for tech gadgets in India</p>
              </div>
            </div>

            <div className={styles.postsGrid}>
              {products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <p className={styles.noResults}>No reviews found yet.</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export async function getStaticProps() {
  try {
    const products = await getProducts(null, 100, 0);
    return {
      props: { products },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return {
      props: { products: [] },
      revalidate: 10,
    };
  }
}
