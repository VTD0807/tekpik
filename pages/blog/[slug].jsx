import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/BlogPost.module.css';

const blogPosts = {
  'best-budget-phones-2024': {
    title: 'Best Budget Phones Under ₹15,000 in 2024',
    date: '2024-03-20',
    author: 'TekPik Team',
    category: 'Smartphones',
    readTime: '8 min read',
    image: '[P]',
    content: `
      <h2>Introduction</h2>
      <p>Finding the best budget smartphone can be overwhelming. In this comprehensive guide, we review the top budget phones under ₹15,000 available in India.</p>
      
      <h2>What to Look for in Budget Phones</h2>
      <ul>
        <li>Processor performance and daily usage</li>
        <li>Display quality and refresh rate</li>
        <li>Camera quality in different lighting</li>
        <li>Battery life for full day usage</li>
        <li>Build quality and durability</li>
        <li>Software updates and support</li>
      </ul>
      
      <h2>Top Budget Phones 2024</h2>
      <p>After testing multiple devices, here are our top recommendations:</p>
      
      <h3>1. Best Overall: Xiaomi Redmi Note 13</h3>
      <p>Price: ₹12,999 | Rating: ★★★★★</p>
      <p>The Redmi Note 13 offers excellent value with a 120Hz AMOLED display, decent processor, and 5000mAh battery. Perfect for everyday usage and casual gaming.</p>
      
      <h3>2. Best Camera: Samsung Galaxy A15</h3>
      <p>Price: ₹14,999 | Rating: ★★★★☆</p>
      <p>Samsung's A15 delivers impressive camera performance with its 50MP main sensor. Great for photography enthusiasts on a budget.</p>
      
      <h3>3. Best Battery Life: Realme 12</h3>
      <p>Price: ₹13,999 | Rating: ★★★★☆</p>
      <p>With a massive 5000mAh battery and 120W fast charging, the Realme 12 ensures you never run out of power during your day.</p>
      
      <h2>Verdict</h2>
      <p>The best budget phone depends on your priorities. If you want overall value, go with the Redmi Note 13. For photography, choose the Galaxy A15. Need battery life? Pick the Realme 12.</p>
    `,
  },
  'earphones-buying-guide': {
    title: 'Complete Earphones Buying Guide for Indian Buyers',
    date: '2024-03-18',
    author: 'TekPik Team',
    category: 'Audio',
    readTime: '10 min read',
    image: '[H]',
    content: `
      <h2>Introduction</h2>
      <p>Choosing the right earphones can significantly improve your audio experience. This guide covers everything you need to know.</p>
      
      <h2>Earphone Types</h2>
      <h3>True Wireless Earbuds</h3>
      <p>No wires at all. Most popular for convenience and portability.</p>
      
      <h3>In-Ear Wired</h3>
      <p>Connected by a wire. Better battery life and usually more affordable.</p>
      
      <h3>Over-Ear Headphones</h3>
      <p>Full-size headphones. Best for professional use and extended listening.</p>
      
      <h2>Key Specifications to Consider</h2>
      <ul>
        <li><strong>Driver Size:</strong> Larger drivers = better bass (8-12mm typical)</li>
        <li><strong>Frequency Response:</strong> 20Hz-20kHz covers human hearing range</li>
        <li><strong>Impedance:</strong> Lower impedance = easier to drive</li>
        <li><strong>Noise Cancellation:</strong> Active (ANC) vs Passive</li>
        <li><strong>Battery Life:</strong> At least 6-8 hours for TWS</li>
        <li><strong>Connectivity:</strong> Bluetooth 5.0+ recommended</li>
      </ul>
      
      <h2>Verdict</h2>
      <p>Balance your priorities between sound quality, comfort, battery life, and price. Test before buying if possible.</p>
    `,
  },
};

export default function BlogPost({ post, slug }) {
  if (!post) {
    return (
      <main id="main-content" className={styles.main}>
        <div className={styles.container}>
          <Link href="/blog" className={styles.backLink}>← Back to Blog</Link>
          <p>Post not found</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{post.title} | TekPik Blog</title>
        <meta name="description" content={`Read ${post.title} on TekPik blog. Expert tech guide for Indian buyers.`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:type" content="article" />
        <meta property="article:author" content={post.author} />
        <meta property="article:published_time" content={post.date} />
        <meta property="article:section" content={post.category} />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "image": `https://tekpik.in/og-image.jpg`,
            "datePublished": post.date,
            "author": {
              "@type": "Organization",
              "name": post.author,
              "url": "https://tekpik.in"
            }
          })
        }} />
      </Head>
      <main id="main-content" className={styles.main}>
        <article className={styles.articleContainer}>
          <Link href="/blog" className={styles.backLink}>← Back to Blog</Link>

          <header className={styles.header}>
            <div className={styles.headerImage}>{post.image}</div>
            <div>
              <h1>{post.title}</h1>
              <div className={styles.meta}>
                <span className={styles.category}>{post.category}</span>
                <span className={styles.date}>
                  {new Date(post.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className={styles.readTime}>{post.readTime}</span>
              </div>
              <p className={styles.byline}>By {post.author}</p>
            </div>
          </header>

          <div 
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <footer className={styles.footer}>
            <p>Have questions? <Link href="/help/faq">Check our FAQ</Link> or <Link href="/">browse more products</Link>.</p>
          </footer>
        </article>
      </main>
    </>
  );
}

export async function getStaticProps({ params }) {
  const post = blogPosts[params.slug];
  
  if (!post) {
    return { notFound: true };
  }

  return {
    props: { post, slug: params.slug },
    revalidate: 3600,
  };
}

export async function getStaticPaths() {
  const paths = Object.keys(blogPosts).map(slug => ({
    params: { slug }
  }));

  return {
    paths,
    fallback: 'blocking',
  };
}
