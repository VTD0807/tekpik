import Head from 'next/head';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import Newsletter from '@/components/Newsletter';
import ProductCard from '@/components/ProductCard';
import { getProducts, getCategories } from '@/lib/db';
import styles from '@/styles/Home.module.css';

export default function Home({ products, categories }) {
  return (
    <>
      <Head>
        <title>TekPik | Tech Gadget Reviews, Buying Guides and Deals in India</title>
      </Head>
      <main id="main-content">
        <Hero />
        <Stats />

        {/* Featured Reviews */}
        <section className={styles.section} id="reviews" aria-labelledby="featured-reviews-title">
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionLabel}>Latest</div>
              <h2 id="featured-reviews-title">Featured Reviews</h2>
            </div>
            <a href="/reviews" className={styles.seeAll}>See all →</a>
          </div>
          <div className={styles.postsGrid}>
            {products.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className={styles.section} id="categories" aria-labelledby="categories-title">
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionLabel}>Browse</div>
              <h2 id="categories-title">Shop by Category</h2>
            </div>
          </div>
          <div className={styles.categoriesGrid}>
            {categories.map((cat) => (
              <a key={cat.id} href={`/categories/${cat.slug}`} className={styles.catCard}>
                <div className={styles.catIcon}>{cat.icon || '📦'}</div>
                <div className={styles.catName}>{cat.name}</div>
              </a>
            ))}
          </div>
        </section>

        <Newsletter />
      </main>
    </>
  );
}

export async function getStaticProps() {
  try {
    const products = await getProducts(null, 6, 0);
    const categories = await getCategories();
    return {
      props: { products, categories },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return {
      props: { products: [], categories: [] },
      revalidate: 10,
    };
  }
}
