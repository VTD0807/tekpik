import Head from 'next/head';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { getProducts, getCategories } from '@/lib/db';
import styles from '@/styles/CategoryPage.module.css';

export default function CategoryPage({ category, products }) {
  if (!category) {
    return (
      <main id="main-content" className={styles.main}>
        <div className={styles.container}>
          <h1>Category not found</h1>
          <Link href="/">← Back to home</Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{category.name} | TekPik - Tech Reviews India</title>
        <meta name="description" content={`Browse all ${category.name} reviews on TekPik. Find honest reviews and recommendations for Indian buyers.`} />
      </Head>
      <main id="main-content" className={styles.main}>
        <div className={styles.container}>
          <Link href="/" className={styles.backLink}>← Back to home</Link>

          <section className={styles.section}>
            <div className={styles.categoryHeader}>
              <div className={styles.categoryIcon}>{category.icon || '📦'}</div>
              <div>
                <h1>{category.name}</h1>
                {category.description && <p className={styles.description}>{category.description}</p>}
              </div>
            </div>

            <div className={styles.postsGrid}>
              {products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <p className={styles.noResults}>No products in this category yet.</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export async function getStaticProps({ params }) {
  try {
    const categories = await getCategories();
    const category = categories.find((c) => c.slug === params.slug);

    if (!category) {
      return { notFound: true };
    }

    const products = await getProducts(category.name, 100, 0);

    return {
      props: { category, products },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Failed to fetch category:', error);
    return { notFound: true };
  }
}

export async function getStaticPaths() {
  try {
    const categories = await getCategories();
    const paths = categories.map((cat) => ({
      params: { slug: cat.slug },
    }));

    return {
      paths,
      fallback: 'blocking',
    };
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
}
