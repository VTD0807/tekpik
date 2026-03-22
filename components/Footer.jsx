import Link from 'next/link';
import styles from '@/styles/Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div>
          <Link href="/" className={styles.logo} style={{ marginBottom: '6px', display: 'inline-flex' }}>
            tekpik<span className={styles.logoDot}></span>
          </Link>
          <div className={styles.footerCopy}>© 2024 TekPik. Smart picks for smart buyers.</div>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/help/about">About</Link>
          <Link href="/help/disclaimer">Disclaimer</Link>
          <Link href="/help/privacy">Privacy Policy</Link>
          <Link href="/help/terms">Terms of Service</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
