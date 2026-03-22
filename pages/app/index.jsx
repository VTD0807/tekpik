import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '@/styles/App.module.css';
import { getIconForCategory } from '@/components/icons';

export default function App() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Fetch products from API on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=50');
        const data = await response.json();
        setProducts(data || []);
        setFilteredProducts(data || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };
    fetchProducts();
  }, []);

  const categories = ['All', 'Smartphones', 'Laptops', 'Audio', 'Tablets', 'Smartwatches', 'Drones', 'Cameras', 'Gaming'];

  useEffect(() => {
    let results = products;

    // Filter by category
    if (selectedCategory !== 'All') {
      results = results.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      results = results.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(results);
  }, [searchQuery, selectedCategory]);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Head>
        <title>TekPik Store - Buy Tech Products Online</title>
        <meta name="description" content="Shop the latest tech gadgets and products with TekPik Store." />
      </Head>

      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading TekPik Store...</p>
          </div>
        </div>
      )}

      <div className={`${styles.container} ${isLoading ? styles.hidden : ''}`}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1>TekPik Store</h1>
            <button className={styles.cartBtn} onClick={() => setShowCart(!showCart)}>
              Cart ({cartCount})
            </button>
          </div>

          {/* Global Search Bar */}
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search tech products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>⊙</span>
          </div>
        </header>

        <div className={styles.mainLayout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <h3>Categories</h3>
            <div className={styles.categories}>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={selectedCategory === cat ? styles.activeCat : ''}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </aside>

          {/* Products Section */}
          <main className={styles.productsSection}>
            <div className={styles.productsHeader}>
              <h2>
                {searchQuery ? `Search Results: "${searchQuery}"` : selectedCategory === 'All' ? 'All Products' : selectedCategory}
              </h2>
              <p>{filteredProducts.length} products found</p>
            </div>

            {filteredProducts.length > 0 ? (
              <div className={styles.productsGrid}>
                {filteredProducts.map(product => (
                  <div key={product.id} className={styles.productCard}>
                    <div className={styles.productImage}>
                      {getIconForCategory(product.category)}
                    </div>
                    <div className={styles.productInfo}>
                      <h3>{product.name}</h3>
                      <p className={styles.category}>{product.category}</p>
                      <div className={styles.rating}>
                        {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))} {product.rating}
                      </div>
                      <p className={styles.reviews}>({product.reviews} reviews)</p>
                      <div className={styles.price}>₹{product.price.toLocaleString('en-IN')}</div>
                      <button className={styles.addBtn} onClick={() => addToCart(product)}>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noProducts}>
                <p>No products found. Try a different search or category.</p>
              </div>
            )}
          </main>

          {/* Cart Sidebar */}
          {showCart && (
            <aside className={styles.cartSidebar}>
              <h3>Shopping Cart</h3>
              {cart.length > 0 ? (
                <>
                  <div className={styles.cartItems}>
                    {cart.map(item => (
                      <div key={item.id} className={styles.cartItem}>
                        <div className={styles.cartItemInfo}>
                          <div className={styles.cartItemName}>{item.name}</div>
                          <div className={styles.cartItemPrice}>₹{item.price.toLocaleString('en-IN')}</div>
                        </div>
                        <div className={styles.cartItemControls}>
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                        </div>
                        <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className={styles.cartSummary}>
                    <div className={styles.cartTotal}>
                      <strong>Subtotal:</strong> ₹{cartTotal.toLocaleString('en-IN')}
                    </div>
                    <button className={styles.checkoutBtn}>Checkout</button>
                  </div>
                </>
              ) : (
                <p className={styles.emptyCart}>Your cart is empty</p>
              )}
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
