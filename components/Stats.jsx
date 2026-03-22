import styles from '@/styles/Stats.module.css';

export default function Stats() {
  const stats = [
    { num: '200+', label: 'Products Reviewed' },
    { num: '50K+', label: 'Monthly Readers' },
    { num: '100%', label: 'Honest Reviews' },
    { num: '₹0', label: 'Always Free to Read' },
  ];

  return (
    <div className={styles.statsStrip}>
      <div className={styles.statsInner}>
        {stats.map((stat, i) => (
          <div key={i} className={styles.stat}>
            <div className={styles.statNum}>{stat.num}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
