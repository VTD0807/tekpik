import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/About.module.css';

export default function About() {
  return (
    <>
      <Head>
        <title>About TekPik | Expert Tech Reviews for India</title>
        <meta name="description" content="TekPik is an independent tech review platform providing honest gadget reviews and buying guides for Indian consumers." />
        <meta property="og:title" content="About TekPik" />
        <meta property="og:description" content="Learn about TekPik's mission, team, and commitment to honest tech reviews." />
        <link rel="canonical" href="https://tekpik.com/help/about" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "TekPik",
            "url": "https://tekpik.in",
            "logo": "https://tekpik.in/og-image.jpg",
            "description": "Independent tech gadget reviews and buying guides for Indian users",
            "sameAs": [
              "https://twitter.com/tekpik",
              "https://facebook.com/tekpik",
              "https://instagram.com/tekpik"
            ]
          })
        }} />
      </Head>
      <main id="main-content" className={styles.main}>
        <div className={styles.container}>
          <section className={styles.header}>
            <h1>About TekPik</h1>
            <p>Honest tech reviews and expert buying guides for Indian gadget buyers</p>
          </section>

          <div className={styles.content}>
            <section className={styles.section}>
              <h2>Our Mission</h2>
              <p>
                TekPik's mission is to help Indian buyers make informed decisions about tech purchases. 
                We believe that everyone deserves access to honest, expert reviews without hidden agendas or paid promotions.
              </p>
            </section>

            <section className={styles.section}>
              <h2>What Makes Us Different</h2>
              <ul>
                <li>✅ <strong>Completely Independent</strong> - No corporate backing or hidden interests</li>
                <li>✅ <strong>Honest Reviews</strong> - We test products thoroughly and share real experiences</li>
                <li>✅ <strong>India-Focused</strong> - Reviews tailored for Indian market and pricing</li>
                <li>✅ <strong>Budget-Friendly</strong> - We review products at ALL price points, not just expensive gear</li>
                <li>✅ <strong>Expert Testing</strong> - Real-world testing for 2-3 weeks before publishing</li>
                <li>✅ <strong>Community-Driven</strong> - Your feedback helps us improve</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>Our Review Process</h2>
              <ol>
                <li><strong>Selection:</strong> We choose products based on popularity and reader requests</li>
                <li><strong>Testing:</strong> Real-world testing in various conditions for 2-3 weeks</li>
                <li><strong>Analysis:</strong> Detailed evaluation of performance, quality, and value</li>
                <li><strong>Writing:</strong> Comprehensive review with pros, cons, and verdict</li>
                <li><strong>Updates:</strong> Regular updates as new models launch or prices change</li>
              </ol>
            </section>

            <section className={styles.section}>
              <h2>Why Trust TekPik?</h2>
              <p>
                We've reviewed over 200 products and helped thousands of Indian buyers make smarter purchasing decisions. 
                Our readers trust us because we're transparent about our process and always put their interests first.
              </p>
            </section>

            <section className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statNum}>200+</div>
                <div className={styles.statLabel}>Products Reviewed</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNum}>50K+</div>
                <div className={styles.statLabel}>Monthly Readers</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNum}>100%</div>
                <div className={styles.statLabel}>Independent</div>
              </div>
            </section>
          </div>

          <section className={styles.cta}>
            <h2>Ready to find your perfect gadget?</h2>
            <Link href="/reviews" className={styles.ctaButton}>Browse All Reviews</Link>
          </section>
        </div>
      </main>
    </>
  );
}

export async function getStaticProps() {
  return {
    props: {},
    revalidate: 86400,
  };
}
