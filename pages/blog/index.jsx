import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Blog.module.css';

const posts = [
  {
    slug: 'best-budget-phones-2024',
    title: 'Best Budget Phones Under ₹15,000 in 2024',
    excerpt: 'Find the perfect affordable smartphone with our expert recommendations and detailed comparisons.',
    date: '2024-03-20',
    category: 'Smartphones',
    readTime: '8 min read',
    image: '[P]'
  },
  {
    slug: 'earphones-buying-guide',
    title: 'Complete Earphones Buying Guide for Indian Buyers',
    excerpt: 'Learn how to choose the best earphones based on sound quality, battery life, and price.',
    date: '2024-03-18',
    category: 'Audio',
    readTime: '10 min read',
    image: '[H]'
  },
  {
    slug: 'tech-deals-march-2024',
    title: 'Best Tech Deals in March 2024',
    excerpt: 'Exclusive deals on gadgets from Amazon, Flipkart, and other retailers.',
    date: '2024-03-15',
    category: 'Deals',
    readTime: '5 min read',
    image: '🎁'
  },
];

export default function Blog() {
  return (
    <>
      <Head>
        <title>Tech Blog | TekPik - Expert Articles & Buying Guides</title>
        <meta name="description" content="Read latest tech news, buying guides, product reviews, and expert tips for Indian gadget buyers." />
        <meta property="og:title" content="Tech Blog | TekPik" />
        <meta property="og:description" content="Expert tech articles, buying guides, and reviews for Indian buyers." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tekpik.in/blog" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "TekPik Blog",
            "description": "Expert tech articles and buying guides for Indian gadget buyers",
            "url": "https://tekpik.in/blog"
          })
        }} />
      </Head>
      <main id="main-content" className={styles.main}>
        <div className={styles.container}>
          <section className={styles.header}>
            <h1>Tech Blog & Guides</h1>
            <p>Expert articles, buying guides, and tech tips for smart Indian buyers</p>
          </section>

          <div className={styles.blogGrid}>
            {posts.map((post) => (
              <article key={post.slug} className={styles.blogCard}>
                <Link href={`/blog/${post.slug}`}>
                  <div className={styles.postImage}>{post.image}</div>
                  <div className={styles.postContent}>
                    <div className={styles.postMeta}>
                      <span className={styles.category}>{post.category}</span>
                      <span className={styles.date}>{new Date(post.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <h2 className={styles.postTitle}>{post.title}</h2>
                    <p className={styles.postExcerpt}>{post.excerpt}</p>
                    <div className={styles.postFooter}>
                      <span className={styles.readTime}>{post.readTime}</span>
                      <span className={styles.readMore}>Read Article →</span>
                    </div>
                  </div>
                </Link>
              </article>
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
