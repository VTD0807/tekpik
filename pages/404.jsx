import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/NotFound.module.css';

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Page Not Found | TekPik</title>
      </Head>
      <main id="main-content" className={styles.main}>
        <div className={styles.container}>
          <div className={styles.content}>
            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>Sorry, we couldn't find the page you're looking for.</p>
            <Link href="/" className={styles.btnPrimary}>Back to Home</Link>
          </div>
        </div>
      </main>
    </>
  );
}
