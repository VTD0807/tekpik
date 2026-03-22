'use client';

import { useState } from 'react';
import styles from '@/styles/Newsletter.module.css';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setEmail('');
        setStatus('✓ Subscribed successfully!');
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus('Error subscribing');
      }
    } catch (error) {
      setStatus('Error subscribing');
    }
  };

  return (
    <section className={styles.newsletter} id="newsletter" aria-labelledby="newsletter-title">
      <div>
        <h2 id="newsletter-title">Stay ahead of the curve.</h2>
        <p>Get weekly tech picks, deals, and honest reviews delivered straight to your inbox. No spam, ever.</p>
      </div>
      <div>
        <form className={styles.newsletterForm} onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Subscribe</button>
        </form>
        {status && <p className={styles.status}>{status}</p>}
      </div>
    </section>
  );
}
