import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '@/styles/admin/AdminLayout.module.css';

export default function AdminLayout({ children }) {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; max-age=0';
    router.push('/oq2026/vtx/admin/login');
  };

  const isActive = (path) => router.pathname === path;

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>TekPik Admin</h2>
        </div>

        <nav className={styles.sidebarNav}>
          <Link
            href="/oq2026/vtx/admin/"
            className={isActive('/oq2026/vtx/admin/') ? styles.active : ''}
          >
            Dashboard
          </Link>
          <Link
            href="/oq2026/vtx/admin/products"
            className={isActive('/oq2026/vtx/admin/products') ? styles.active : ''}
          >
            Products
          </Link>
          <Link
            href="/oq2026/vtx/admin/categories"
            className={isActive('/oq2026/vtx/admin/categories') ? styles.active : ''}
          >
            Categories
          </Link>
          <Link
            href="/oq2026/vtx/admin/reviews"
            className={isActive('/oq2026/vtx/admin/reviews') ? styles.active : ''}
          >
            Reviews
          </Link>
          <Link
            href="/oq2026/vtx/admin/users"
            className={isActive('/oq2026/vtx/admin/users') ? styles.active : ''}
          >
            Users
          </Link>
          <Link
            href="/oq2026/vtx/admin/deals"
            className={isActive('/oq2026/vtx/admin/deals') ? styles.active : ''}
          >
            Deals
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
