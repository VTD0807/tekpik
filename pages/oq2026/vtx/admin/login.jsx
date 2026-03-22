import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/admin/Login.module.css';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple authentication - in production use proper JWT
    if (username === 'admin' && password === 'tekpik2026') {
      document.cookie = 'admin_token=valid; path=/; max-age=86400';
      router.push('/oq2026/vtx/admin/');
    } else {
      setError('Invalid username or password');
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1>TekPik Admin</h1>
        <p className={styles.subtitle}>Admin Login</p>

        <form onSubmit={handleLogin}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className={styles.loginBtn}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className={styles.credentials}>
          <p><strong>Demo Credentials:</strong></p>
          <p>Username: admin</p>
          <p>Password: tekpik2026</p>
        </div>
      </div>
    </div>
  );
}
