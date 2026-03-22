import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Guides.module.css';

const guides = [
  {
    slug: 'smartphone-buying-guide-2024',
    title: 'Ultimate Smartphone Buying Guide 2024',
    description: 'Complete guide to choosing the perfect smartphone based on your needs and budget.',
    category: 'Smartphones',
    readTime: '12 min read',
    image: '[P]'
  },
  {
    slug: 'wireless-earphones-guide',
    title: 'Wireless Earphones Buying Guide',
    description: 'Learn about different earphone types, features, and how to choose the best for you.',
    category: 'Audio',
    readTime: '10 min read',
    image: '[H]'
  },
  {
    slug: 'laptop-for-students',
    title: 'Best Laptops for Students in India',
    description: 'Choose the perfect laptop for studies, coding, and entertainment on a budget.',
    category: 'Computers',
    readTime: '15 min read',
    image: '[L]'
  },
  {
    slug: 'smart-home-setup',
    title: 'Smart Home Setup Guide for Beginners',
    description: 'Get started with smart home devices and automation on a budget.',
    category: 'Smart Home',
    readTime: '8 min read',
    image: '[H]'
  },
];

export default function Guides() {
  return (
    <>
      <Head>
        <title>Buying Guides | TekPik - Expert Tech Purchasing Tips</title>
        <meta name="description" content="Expert buying guides for tech gadgets in India. Learn how to choose the right products for your needs and budget." />
        <meta property="og:title" content="Buying Guides | TekPik" />
        <meta property="og:description" content="Expert buying guides and tech purchasing tips for Indian buyers." />
      </Head>
      <main id="main-content" className={styles.main}>
        <div className={styles.container}>
          <section className={styles.header}>
            <h1>Buying Guides</h1>
            <p>Expert guides to help you choose the best tech products for your needs and budget</p>
          </section>

          <div className={styles.guidesGrid}>
            {guides.map((guide) => (
              <Link key={guide.slug} href={`/help/guides/${guide.slug}`} className={styles.guideCard}>
                <div className={styles.guideImage}>{guide.image}</div>
                <div className={styles.guideContent}>
                  <span className={styles.category}>{guide.category}</span>
                  <h2 className={styles.guideTitle}>{guide.title}</h2>
                  <p className={styles.guideDescription}>{guide.description}</p>
                  <span className={styles.readTime}>{guide.readTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export async function getStaticProps() {
  return {
    props: {},
    revalidate: 3600,
  };
}
