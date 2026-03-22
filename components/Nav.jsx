import Link from 'next/link';
import styles from '@/styles/Nav.module.css';

export default function Nav() {
  return (
    <nav className={styles.nav} aria-label="Primary">
      <Link href="/" className={styles.logo}>
        tekpik<span className={styles.logoDot}></span>
      </Link>
      <ul className={styles.navLinks}>
        <li><a href="#reviews">Reviews</a></li>
        <li><a href="#categories">Categories</a></li>
        <li><Link href="/deals">Deals</Link></li>
        <li><a href="#about">About</a></li>
        <li><a href="#newsletter" className={styles.navCta}>Get Updates</a></li>
      </ul>
    </nav>
  );
}
