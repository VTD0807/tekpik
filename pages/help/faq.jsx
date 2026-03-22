import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/FAQ.module.css';

const faqItems = [
  {
    question: 'How do you test products at TekPik?',
    answer: 'We test each product for at least 2-3 weeks in real-world conditions. We evaluate sound quality, battery life, build quality, and durability before writing reviews.',
  },
  {
    question: 'Are the reviews on TekPik honest and unbiased?',
    answer: 'Yes, absolutely. We never accept payments for positive reviews. We test products independently and provide honest feedback including pros and cons.',
  },
  {
    question: 'How often do you update reviews?',
    answer: 'We update reviews when new models launch or when there are significant changes to products. We also re-test popular products annually.',
  },
  {
    question: 'Where can I buy the products you review?',
    answer: 'We provide direct links to Amazon, Flipkart, and other major Indian retailers. Prices and availability may vary by seller.',
  },
  {
    question: 'Do you accept product sponsorships?',
    answer: 'We accept product samples for review but maintain complete editorial independence. Sponsored content is clearly marked.',
  },
  {
    question: 'How can I contact TekPik for product review requests?',
    answer: 'Email us at hello@tekpik.in with product details. We review all requests but can only test products we believe will be valuable to our readers.',
  },
  {
    question: 'What is your affiliate link policy?',
    answer: 'We use affiliate links from Amazon and Flipkart. This helps fund our reviews but does not affect our recommendations.',
  },
  {
    question: 'Do you test budget products?',
    answer: 'Yes! Budget products are our specialty. We test gadgets under ₹1,000 to ₹50,000 and focus on value-for-money recommendations.',
  },
];

export default function FAQ() {
  return (
    <>
      <Head>
        <title>FAQ | TekPik - Frequently Asked Questions</title>
        <meta name="description" content="Get answers to common questions about TekPik reviews, testing methodology, and product recommendations." />
        <meta property="og:title" content="FAQ | TekPik" />
        <meta property="og:description" content="Frequently asked questions about TekPik reviews and recommendations." />
        <link rel="canonical" href="https://tekpik.com/help/faq" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqItems.map(item => ({
              "@type": "Question",
              "name": item.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
              }
            }))
          })
        }} />
      </Head>
      <main id="main-content" className={styles.main}>
        <div className={styles.container}>
          <section className={styles.header}>
            <h1>Frequently Asked Questions</h1>
            <p>Get answers to common questions about TekPik reviews and recommendations</p>
          </section>

          <div className={styles.faqList}>
            {faqItems.map((item, i) => (
              <details key={i} className={styles.faqItem}>
                <summary className={styles.question}>{item.question}</summary>
                <div className={styles.answer}>{item.answer}</div>
              </details>
            ))}
          </div>

          <section className={styles.cta}>
            <h2>Didn't find what you're looking for?</h2>
            <p>Contact us for more information or product review requests.</p>
            <Link href="/contact" className={styles.ctaButton}>Get in Touch</Link>
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
