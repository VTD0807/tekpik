import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import styles from '@/styles/admin/Reviews.module.css';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([
    { id: 1, author: 'John Doe', product: 'iPhone 15 Pro', rating: 5, text: 'Excellent phone!', status: 'approved' },
    { id: 2, author: 'Jane Smith', product: 'Samsung S24', rating: 4, text: 'Great value for money', status: 'pending' },
    { id: 3, author: 'Mike Johnson', product: 'MacBook Pro', rating: 5, text: 'Best laptop ever', status: 'approved' },
    { id: 4, author: 'Sarah Lee', product: 'AirPods Pro', rating: 4, text: 'Good sound quality', status: 'pending' },
  ]);

  const [filter, setFilter] = useState('all');

  const handleApprove = (id) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  };

  const handleReject = (id) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
  };

  const handleDelete = (id) => {
    setReviews(reviews.filter(r => r.id !== id));
  };

  const filteredReviews = filter === 'all' ? reviews : reviews.filter(r => r.status === filter);

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Reviews Management</h1>
          <div className={styles.filters}>
            <button
              className={filter === 'all' ? styles.active : ''}
              onClick={() => setFilter('all')}
            >
              All ({reviews.length})
            </button>
            <button
              className={filter === 'pending' ? styles.active : ''}
              onClick={() => setFilter('pending')}
            >
              Pending ({reviews.filter(r => r.status === 'pending').length})
            </button>
            <button
              className={filter === 'approved' ? styles.active : ''}
              onClick={() => setFilter('approved')}
            >
              Approved ({reviews.filter(r => r.status === 'approved').length})
            </button>
          </div>
        </div>

        <div className={styles.reviewsList}>
          {filteredReviews.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div>
                  <div className={styles.author}>{review.author}</div>
                  <div className={styles.product}>{review.product}</div>
                </div>
                <div className={styles.rating}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} {review.rating}/5
                </div>
              </div>

              <div className={styles.reviewText}>{review.text}</div>

              <div className={styles.status}>
                Status: <span className={styles[review.status]}>{review.status}</span>
              </div>

              <div className={styles.actions}>
                {review.status === 'pending' && (
                  <>
                    <button className={styles.approveBtn} onClick={() => handleApprove(review.id)}>
                      Approve
                    </button>
                    <button className={styles.rejectBtn} onClick={() => handleReject(review.id)}>
                      Reject
                    </button>
                  </>
                )}
                <button className={styles.deleteBtn} onClick={() => handleDelete(review.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps(context) {
  const token = context.req.cookies['admin_token'];
  if (!token) {
    return {
      redirect: {
        destination: '/oq2026/vtx/admin/login',
        permanent: false,
      },
    };
  }
  return { props: {} };
}
