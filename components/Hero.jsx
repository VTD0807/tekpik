import Link from 'next/link';
import styles from '@/styles/Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroContent}>
        <div className={styles.heroLabel}>
          <svg className={styles.heroLabelIcon} aria-hidden="true" viewBox="0 0 24 24">
            <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="currentColor" />
          </svg>
          India's Smart Tech Guide
        </div>
        <h1 id="hero-title">Pick Smarter.<br /><em>Buy Better.</em></h1>
        <p className={styles.heroSub}>
          Honest reviews, budget picks, and expert buying guides for tech gadgets — made for Indian buyers.
        </p>
        <div className={styles.heroActions}>
          <Link href="/reviews" className={styles.btnPrimary}>Explore Reviews</Link>
          <Link href="/app" className={styles.btnAppStore}>Shop Now</Link>
          <Link href="/categories" className={styles.btnGhost}>Browse Categories →</Link>
        </div>
      </div>
      <div className={styles.heroVisual} aria-hidden="true">
        {[
          { icon: '♪', title: 'Best Budget Earphones', price: 'From ₹499' },
          { icon: '📱', title: 'Top Phone Accessories', price: 'From ₹299' },
          { icon: '💡', title: 'Smart Home Picks', price: 'From ₹799' },
          { icon: '⌨', title: 'Desk Setup Essentials', price: 'From ₹999' },
        ].map((card, i) => (
          <div key={i} className={styles.heroCard}>
            <span className={styles.cardIconWrap}>{card.icon}</span>
            <div className={styles.cardTitle}>{card.title}</div>
            <div className={styles.cardPrice}>{card.price}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
