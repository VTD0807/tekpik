import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import styles from '@/styles/admin/Categories.module.css';

export default function AdminCategories() {
  const [categories, setCategories] = useState([
    { id: 1, name: 'Smartphones', products: 45, active: true },
    { id: 2, name: 'Laptops', products: 32, active: true },
    { id: 3, name: 'Audio', products: 67, active: true },
    { id: 4, name: 'Tablets', products: 28, active: true },
    { id: 5, name: 'Smartwatches', products: 56, active: true },
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const handleAdd = () => {
    if (newCategory.trim()) {
      setCategories([...categories, { id: Date.now(), name: newCategory, products: 0, active: true }]);
      setNewCategory('');
      setShowAdd(false);
    }
  };

  const toggleActive = (id) => {
    setCategories(categories.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const handleDelete = (id) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Categories Management</h1>
          <button className={styles.addBtn} onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Cancel' : '+ Add Category'}
          </button>
        </div>

        {showAdd && (
          <div className={styles.formBox}>
            <h2>Add New Category</h2>
            <div className={styles.form}>
              <input
                type="text"
                placeholder="Category Name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button className={styles.submitBtn} onClick={handleAdd}>Add Category</button>
            </div>
          </div>
        )}

        <table className={styles.categoriesTable}>
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Products Count</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.products}</td>
                <td>
                  <span className={category.active ? styles.active : styles.inactive}>
                    {category.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className={styles.toggleBtn} onClick={() => toggleActive(category.id)}>
                    {category.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(category.id)}>Delete</button>
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
