import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import styles from '@/styles/admin/Dashboard.module.css';

export default function AdminDashboard() {
  const [stats] = useState({
    totalProducts: 247,
    totalReviews: 1230,
    totalUsers: 5432,
    activeDeals: 18,
    monthlyRevenue: '₹2,45,678',
    avgRating: 4.6
  });

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Dashboard</h1>
          <p>Welcome to TekPik Admin Panel</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Products</div>
            <div className={styles.statValue}>{stats.totalProducts}</div>
            <div className={styles.statChange}>↑ 12 this month</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Reviews</div>
            <div className={styles.statValue}>{stats.totalReviews}</div>
            <div className={styles.statChange}>↑ 145 this month</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Active Users</div>
            <div className={styles.statValue}>{stats.totalUsers}</div>
            <div className={styles.statChange}>↑ 234 this month</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Active Deals</div>
            <div className={styles.statValue}>{stats.activeDeals}</div>
            <div className={styles.statChange}>↑ 5 this month</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Monthly Revenue</div>
            <div className={styles.statValue}>{stats.monthlyRevenue}</div>
            <div className={styles.statChange}>↑ 23% vs last month</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Avg Rating</div>
            <div className={styles.statValue}>{stats.avgRating}</div>
            <div className={styles.statChange}>↑ 0.2 points</div>
          </div>
        </div>

        <div className={styles.secondRow}>
          <div className={styles.recentActivity}>
            <h2>Recent Activity</h2>
            <table className={styles.activityTable}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Product</td>
                  <td>Added iPhone 15 Pro Max review</td>
                  <td>2 hours ago</td>
                  <td><span className={styles.statusBadge}>Completed</span></td>
                </tr>
                <tr>
                  <td>Review</td>
                  <td>Approved user review for AirPods Pro</td>
                  <td>4 hours ago</td>
                  <td><span className={styles.statusBadge}>Completed</span></td>
                </tr>
                <tr>
                  <td>Deal</td>
                  <td>Created new tech deal - 25% off</td>
                  <td>1 day ago</td>
                  <td><span className={styles.statusBadge}>Active</span></td>
                </tr>
                <tr>
                  <td>Category</td>
                  <td>Updated Smartphones category</td>
                  <td>2 days ago</td>
                  <td><span className={styles.statusBadge}>Completed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps(context) {
  // Add authentication check here
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
