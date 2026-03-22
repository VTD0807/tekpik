import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Deals.module.css';

const deals = [
  {
    title: 'Sony WF-C700N Earphones - 20% OFF',
    originalPrice: '₹12,499',
    dealPrice: '₹9,999',
    discount: '20%',
    store: 'Amazon',
    link: 'https://amazon.in',
    category: 'Audio',
    expiresIn: '2 days',
    badge: 'Hot Deal'
  },
  {
    title: 'Samsung Galaxy A15 - ₹2,000 OFF',
    originalPrice: '₹14,999',
    dealPrice: '₹12,999',
    discount: '13%',
    store: 'Flipkart',
    link: 'https://flipkart.com',
    category: 'Smartphones',
    expiresIn: '4 days',
    badge: 'Exclusive'
  },
  {
    title: 'Xiaomi Band 8 Smartwatch - ₹1,500 OFF',
    originalPrice: '₹3,999',
    dealPrice: '₹2,499',
    discount: '37%',
    store: 'Amazon',
    link: 'https://amazon.in',
    category: 'Wearables',
    expiresIn: '1 day',
    badge: 'Limited Time'
  },
];

export default function Deals() {
  return (
    <>
      <Head>
        <title>Latest Tech Deals | TekPik - Best Discounts in India</title>
        <meta name="description" content="Find the best tech deals and discounts on gadgets across Amazon, Flipkart, and other Indian retailers." />
        <meta property="og:title" content="Latest Tech Deals | TekPik" />
        <meta property="og:description" content="Best tech discounts and deals from Amazon, Flipkart, and Indian retailers." />
      </Head>
      <main id="main-content" className={styles.main}>
        <div className={styles.container}>
          <section className={styles.header}>
            <h1>Latest Tech Deals</h1>
            <p>Best discounts and exclusive deals on gadgets from Indian retailers</p>
          </section>

          <div className={styles.dealsGrid}>
            {deals.map((deal, i) => (
              <div key={i} className={styles.dealCard}>
                <div className={styles.dealBadge}>{deal.badge}</div>
                <div className={styles.dealHeader}>
                  <span className={styles.category}>{deal.category}</span>
                  <span className={styles.discount}>{deal.discount} OFF</span>
                </div>
                <h2 className={styles.dealTitle}>{deal.title}</h2>
                <div className={styles.pricing}>
                  <span className={styles.original}>{deal.originalPrice}</span>
                  <span className={styles.price}>{deal.dealPrice}</span>
                </div>
                <div className={styles.dealFooter}>
                  <span className={styles.store}>{deal.store}</span>
                  <span className={styles.expires}>Expires in {deal.expiresIn}</span>
                </div>
                <a href={deal.link} target="_blank" rel="noopener noreferrer" className={styles.viewDeal}>
                  View Deal on {deal.store}
                </a>
              </div>
            ))}
          </div>

          <section className={styles.alert}>
            <p>💡 <strong>Pro Tip:</strong> Subscribe to our newsletter to get daily deals and exclusive discounts!</p>
          </section>
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
