import Link from 'next/link';
import styles from '@/styles/ProductCard.module.css';

export default function ProductCard({ product }) {
  const bgClasses = {
    Earphones: 'blueBg',
    'Smart Home': 'greenBg',
    Accessories: 'warmBg',
  };

  return (
    <Link href={`/products/${product.id}`} className={styles.postCard}>
      <div className={`${styles.postThumb} ${styles[bgClasses[product.category] || 'blueBg']}`}>
        [P]
      </div>
      <div className={styles.postBody}>
        <div className={styles.postTags}>
          <span className={styles.tag}>{product.category}</span>
          {product.avg_rating && <span className={styles.tag}>{product.avg_rating} ★</span>}
        </div>
        <div className={styles.postTitle}>{product.name}</div>
        <div className={styles.postExcerpt}>{product.description?.substring(0, 80)}...</div>
        <div className={styles.postMeta}>
          <span>₹{product.price}</span>
          <span>{product.review_count || 0} reviews</span>
        </div>
      </div>
    </Link>
  );
}
