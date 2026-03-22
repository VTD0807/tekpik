import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import styles from '@/styles/admin/Deals.module.css';

export default function AdminDeals() {
  const [deals, setDeals] = useState([
    { id: 1, product: 'iPhone 15', discount: '15%', originalPrice: '₹1,19,999', salePrice: '₹1,01,999', expires: '2024-04-15', active: true },
    { id: 2, product: 'Samsung Galaxy S24', discount: '20%', originalPrice: '₹79,999', salePrice: '₹63,999', expires: '2024-04-20', active: true },
    { id: 3, product: 'MacBook Pro', discount: '10%', originalPrice: '₹1,99,000', salePrice: '₹1,79,100', expires: '2024-04-10', active: false },
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ product: '', discount: '', originalPrice: '', salePrice: '', expires: '' });

  const handleAdd = () => {
    if (formData.product && formData.discount) {
      setDeals([...deals, { ...formData, id: Date.now(), active: true }]);
      setFormData({ product: '', discount: '', originalPrice: '', salePrice: '', expires: '' });
      setShowAdd(false);
    }
  };

  const handleToggle = (id) => {
    setDeals(deals.map(d => d.id === id ? { ...d, active: !d.active } : d));
  };

  const handleDelete = (id) => {
    setDeals(deals.filter(d => d.id !== id));
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Deals Management</h1>
          <button className={styles.addBtn} onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Cancel' : '+ Add Deal'}
          </button>
        </div>

        {showAdd && (
          <div className={styles.formBox}>
            <h2>Add New Deal</h2>
            <div className={styles.form}>
              <input
                type="text"
                placeholder="Product Name"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              />
              <input
                type="text"
                placeholder="Discount %"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              />
              <input
                type="text"
                placeholder="Original Price"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
              />
              <input
                type="text"
                placeholder="Sale Price"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
              />
              <input
                type="date"
                value={formData.expires}
                onChange={(e) => setFormData({ ...formData, expires: e.target.value })}
              />
              <button className={styles.submitBtn} onClick={handleAdd}>Add Deal</button>
            </div>
          </div>
        )}

        <table className={styles.dealsTable}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Discount</th>
              <th>Original Price</th>
              <th>Sale Price</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => (
              <tr key={deal.id}>
                <td>{deal.product}</td>
                <td>{deal.discount}</td>
                <td>{deal.originalPrice}</td>
                <td>{deal.salePrice}</td>
                <td>{deal.expires}</td>
                <td>
                  <span className={deal.active ? styles.active : styles.inactive}>
                    {deal.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className={styles.toggleBtn} onClick={() => handleToggle(deal.id)}>
                    {deal.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(deal.id)}>Delete</button>
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
