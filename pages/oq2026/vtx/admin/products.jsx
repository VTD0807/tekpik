import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import styles from '@/styles/admin/Products.module.css';

export default function AdminProducts() {
  const [products, setProducts] = useState([
    { id: 1, name: 'iPhone 15 Pro Max', category: 'Smartphones', price: '₹1,19,999', rating: 4.8, reviews: 156 },
    { id: 2, name: 'Samsung Galaxy S24', category: 'Smartphones', price: '₹79,999', rating: 4.6, reviews: 98 },
    { id: 3, name: 'MacBook Pro 14"', category: 'Laptops', price: '₹1,99,000', rating: 4.9, reviews: 234 },
    { id: 4, name: 'AirPods Pro 2', category: 'Audio', price: '₹29,999', rating: 4.7, reviews: 567 },
    { id: 5, name: 'iPad Air', category: 'Tablets', price: '₹59,999', rating: 4.5, reviews: 89 },
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: '', price: '', rating: '', reviews: '' });

  const handleAdd = () => {
    if (formData.name && formData.category) {
      if (editingId) {
        setProducts(products.map(p => p.id === editingId ? { ...formData, id: editingId } : p));
        setEditingId(null);
      } else {
        setProducts([...products, { ...formData, id: Date.now() }]);
      }
      setFormData({ name: '', category: '', price: '', rating: '', reviews: '' });
      setShowAdd(false);
    }
  };

  const handleDelete = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product.id);
    setShowAdd(true);
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Products Management</h1>
          <button className={styles.addBtn} onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {showAdd && (
          <div className={styles.formBox}>
            <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <div className={styles.form}>
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <input
                type="text"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <input
                type="number"
                placeholder="Rating"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                step="0.1"
                min="0"
                max="5"
              />
              <input
                type="number"
                placeholder="Reviews Count"
                value={formData.reviews}
                onChange={(e) => setFormData({ ...formData, reviews: e.target.value })}
              />
              <button className={styles.submitBtn} onClick={handleAdd}>
                {editingId ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        )}

        <table className={styles.productsTable}>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Rating</th>
              <th>Reviews</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{product.price}</td>
                <td>{product.rating} ★</td>
                <td>{product.reviews}</td>
                <td>
                  <button className={styles.editBtn} onClick={() => handleEdit(product)}>Edit</button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(product.id)}>Delete</button>
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
