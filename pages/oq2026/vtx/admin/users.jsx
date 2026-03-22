import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import styles from '@/styles/admin/Users.module.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', joinDate: '2024-01-15', reviews: 12, status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', joinDate: '2024-02-20', reviews: 8, status: 'active' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', joinDate: '2024-01-10', reviews: 25, status: 'active' },
    { id: 4, name: 'Sarah Lee', email: 'sarah@example.com', joinDate: '2023-12-05', reviews: 15, status: 'active' },
    { id: 5, name: 'Tom Wilson', email: 'tom@example.com', joinDate: '2024-03-01', reviews: 3, status: 'inactive' },
  ]);

  const handleBan = (id) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: 'banned' } : u));
  };

  const handleDelete = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Users Management</h1>
          <p>Total Users: {users.length}</p>
        </div>

        <table className={styles.usersTable}>
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>Join Date</th>
              <th>Reviews</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.joinDate}</td>
                <td>{user.reviews}</td>
                <td>
                  <span className={styles[user.status]}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <button className={styles.banBtn} onClick={() => handleBan(user.id)}>
                    Ban
                  </button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(user.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
