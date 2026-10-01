import { useState, useEffect } from 'react';
import './App.css';

import Orders from './components/Orders';
import AdminDashboard from './components/AdminDashboard';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
// Format prices in Indian currency style
function formatPrice(price) {
  return Number(price || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Product categories
const categories = [
  { name: 'Electronics', icon: '💻', id: 'electronics', color: 'blue' },
  { name: 'Fashion', icon: '👗', id: 'fashion', color: 'pink' },
  { name: 'Home & Living', icon: '🛋️', id: 'home-living', color: 'cyan' },
  { name: 'Beauty', icon: '💄', id: 'beauty', color: 'purple' },
  { name: 'Books', icon: '📚', id: 'books', color: 'green' },
  { name: 'Sports', icon: '🏀', id: 'sports', color: 'orange' },
  { name: 'Toys', icon: '🧸', id: 'toys', color: 'peach' },
  {
    name: 'All Categories',
    icon: '▦',
    id: 'all-categories',
    color: 'blue',
  },
];

function App() {
  // User role
  const [userRole, setUserRole] = useState(
    () => localStorage.getItem('userRole') || ''
  );

  const isAdmin = userRole === 'ROLE_ADMIN';

  // Products
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search and category filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState('all-categories');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Cart
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // Orders
  const [orderMessage, setOrderMessage] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Account
  const [showAccount, setShowAccount] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [accountMode, setAccountMode] = useState('login');

  const [loggedInEmail, setLoggedInEmail] = useState(
    () => localStorage.getItem('loggedInEmail') || ''
  );

  // Admin
  const [showAdmin, setShowAdmin] = useState(false);

  // Fetch products from Spring Boot
  async function fetchProducts() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/products`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch products: ${response.status}`
        );
      }

      const data = await response.json();

      console.log('Products received from backend:', data);

      if (!Array.isArray(data)) {
        throw new Error('Invalid products response from server.');
      }

      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  // Add a product to the cart
  function addToCart(product) {
    setCart((previousCart) => {
      const existingProduct = previousCart.find(
        (item) => item.id === product.id
      );

      if (existingProduct) {
        return previousCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...previousCart, { ...product, quantity: 1 }];
    });

    setOrderMessage('');
  }

  // Remove a product from the cart
  function removeFromCart(productId) {
    setCart((previousCart) =>
      previousCart.filter((item) => item.id !== productId)
    );
  }

  // Increase quantity
  function increaseQuantity(productId) {
    setCart((previousCart) =>
      previousCart.map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  // Decrease quantity
  function decreaseQuantity(productId) {
    setCart((previousCart) =>
      previousCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  // Total number of items in the cart
  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Calculate cart total
  const totalAmount = cart.reduce(
    (total, item) =>
      total + Number(item.price || 0) * item.quantity,
    0
  );

  // Search and filter products
  const filteredProducts = products.filter((product) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      (product.name || '').toLowerCase().includes(search) ||
      (product.category || '').toLowerCase().includes(search) ||
      (product.description || '').toLowerCase().includes(search);

    const categoryName = categories.find(
      (category) => category.id === selectedCategory
    )?.name;

    const matchesCategory =
      selectedCategory === 'all-categories' ||
      (product.category || '').trim().toLowerCase() ===
        categoryName?.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Select a category
  function handleCategoryClick(categoryId) {
    setSelectedCategory(categoryId);
    setShowCart(false);
    setShowCheckout(false);
    setOrderSuccess(null);
    setOrderMessage('');

    document
      .getElementById('featured')
      ?.scrollIntoView({ behavior: 'smooth' });
  }

  // Open the cart
  function openCart() {
    setShowCart(true);
    setShowCheckout(false);
    setOrderSuccess(null);
    setOrderMessage('');
  }

  // Close the cart and reset checkout state
  function closeCart() {
    setShowCart(false);
    setShowCheckout(false);
    setOrderSuccess(null);
    setOrderMessage('');
  }

  // Place an order
  async function handlePlaceOrder(event) {
    event.preventDefault();

    // Prevent duplicate submissions
    if (placingOrder) {
      return;
    }

    setOrderMessage('');

    if (!loggedInEmail) {
      setAccountMode('login');
      setShowAccount(true);
      return;
    }

    if (cart.length === 0) {
      setOrderMessage('Your cart is empty.');
      return;
    }

    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);

    const fullName = String(
      formData.get('fullName') || ''
    ).trim();

    const email = String(
      formData.get('email') || ''
    ).trim();

    const phone = String(
      formData.get('phone') || ''
    ).trim();

    const address = String(
      formData.get('address') || ''
    ).trim();

    const city = String(
      formData.get('city') || ''
    ).trim();

    const pinCode = String(
      formData.get('pinCode') || ''
    ).trim();

    if (
      !fullName ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !pinCode
    ) {
      setOrderMessage('Please fill in all required fields.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setOrderMessage(
        'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    if (!/^\d{6}$/.test(pinCode)) {
      setOrderMessage('Please enter a valid 6-digit PIN code.');
      return;
    }

    const order = {
      fullName,
      email,
      phone,
      address,
      city,
      pinCode,
      totalAmount,
    };

    try {
      setPlacingOrder(true);
      setOrderMessage('Placing your order...');

      // Get JWT token saved during login
      const token = localStorage.getItem('jwtToken');

      if (!token) {
        setOrderMessage(
          'Please login before placing an order.'
        );

        setAccountMode('login');
        setShowAccount(true);
        return;
      }

      // Send order to Spring Boot
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(order),
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || `Unable to place order (${response.status})`
        );
      }

      const savedOrder = await response.json();

      console.log('Order placed successfully:', savedOrder);

      // Save order details for the confirmation screen
      setOrderSuccess(savedOrder);
      setOrderMessage('');

      // Clear the cart after successful order placement
      setCart([]);

      // Reset the delivery form
      form.reset();
    } catch (error) {
      console.error('Error placing order:', error);

      setOrderMessage(
        `Unable to place order: ${error.message}`
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  // Handle registration and login
  async function handleAccountSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = String(
      formData.get('email') || ''
    ).trim();

    const password = String(
      formData.get('password') || ''
    );

    // Registration
    if (accountMode === 'register') {
      const fullName = String(
        formData.get('name') || ''
      ).trim();

      const confirmPassword = String(
        formData.get('confirmPassword') || ''
      );

      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/users/register`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fullName,
              email,
              password,
            }),
          }
        );

        if (!response.ok) {
          const errorMessage = await response.text();

          throw new Error(
            errorMessage || 'Registration failed'
          );
        }

        alert('Registration successful! Please log in.');

        setAccountMode('login');
        form.reset();
      } catch (error) {
        console.error('Registration error:', error);

        alert(
          error.message || 'Unable to connect to the server'
        );
      }
    } else {
      // Login
      try {
        const response = await fetch(
          `${API_URL}/users/login`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
            }),
          }
        );

        const data = await response.json();

        console.log('Login response:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }

        if (!data.token) {
          throw new Error(
            'Login succeeded, but no token was received.'
          );
        }

        // Normalize the role
        const role = String(data.role || '')
          .trim()
          .toUpperCase();

        const normalizedRole = role.startsWith('ROLE_')
          ? role
          : `ROLE_${role}`;

        console.log('Role received:', normalizedRole);

        // Save login details
        localStorage.setItem('jwtToken', data.token);
        localStorage.setItem(
          'loggedInEmail',
          data.email || email
        );
        localStorage.setItem('userRole', normalizedRole);

        // Update React state
        setLoggedInEmail(data.email || email);
        setUserRole(normalizedRole);

        // Close account modal
        setShowAccount(false);
        form.reset();
      } catch (error) {
        console.error('Login error:', error);

        alert(
          error.message || 'Unable to connect to the server'
        );
      }
    }
  }

  // Logout
  function handleLogout() {
    // Remove saved login information
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('loggedInEmail');
    localStorage.removeItem('userRole');

    // Update React state
    setLoggedInEmail('');
    setUserRole('');

    // Close open screens
    setShowOrders(false);
    setShowCart(false);
    setShowCheckout(false);
    setShowAccount(false);
    setShowAdmin(false);

    setOrderSuccess(null);
    setOrderMessage('');
  }

  return (
    <div className="shop-app">
      {/* HEADER */}
      <header className="site-header">
        <div className="header-main">
          {/* Logo */}
          <a
            href="#home"
            className="brand"
            onClick={() => {
              setSelectedCategory('all-categories');
              setSearchTerm('');
            }}
          >
            <span className="brand-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 8h14l1 13H4L5 8Z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
            </span>

            <span>
              Shop<span className="brand-blue">Ease</span>
            </span>
          </a>

          {/* Search */}
          <div className="header-search">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 4 4" />
            </svg>

            <input
              type="search"
              placeholder="Search for products..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />

            {searchTerm && (
              <button
                className="search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Header actions */}
          <div className="header-actions">
            {loggedInEmail ? (
              <>
                <span className="header-action">
                  👤 {loggedInEmail}
                </span>

                <button
                  className="header-action"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                className="header-action"
                onClick={() => {
                  setAccountMode('login');
                  setShowAccount(true);
                }}
              >
                👤 Account
              </button>
            )}

            <button
              className="order-button"
              onClick={() => {
                if (!loggedInEmail) {
                  setAccountMode('login');
                  setShowAccount(true);
                  return;
                }

                setShowOrders(true);
                setShowCart(false);
                setShowCheckout(false);
                setOrderSuccess(null);
                setShowAccount(false);
              }}
            >
              📦 My Orders
            </button>

            {isAdmin && (
              <button
                className="header-action"
                onClick={() => setShowAdmin(true)}
              >
                🛠️ Admin Dashboard
              </button>
            )}

            <button
              className="header-action"
              onClick={openCart}
            >
              <span className="cart-icon-wrap">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
                </svg>

                {cartCount > 0 && (
                  <span className="cart-badge">
                    {cartCount}
                  </span>
                )}
              </span>

              Cart
            </button>
          </div>
        </div>

        {/* CATEGORY NAVIGATION */}
        <nav className="category-nav">
          <button
            className={`nav-category ${
              selectedCategory === 'all-categories'
                ? 'nav-active'
                : ''
            }`}
            onClick={() => {
              setSelectedCategory('all-categories');
              setSearchTerm('');
            }}
          >
            Home
          </button>

          {categories
            .filter(
              (category) =>
                category.id !== 'all-categories'
            )
            .map((category) => (
              <button
                key={category.id}
                className={`nav-category ${
                  selectedCategory === category.id
                    ? 'nav-active'
                    : ''
                }`}
                onClick={() =>
                  handleCategoryClick(category.id)
                }
              >
                {category.name}
              </button>
            ))}

          <button
            className="nav-category"
            onClick={() =>
              handleCategoryClick('all-categories')
            }
          >
            All Categories <span className="chevron">⌄</span>
          </button>
        </nav>
      </header>

      {/* ACCOUNT MODAL */}
      {showAccount && (
        <div
          className="account-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowAccount(false);
            }
          }}
        >
          <div className="account-modal">
            <button
              className="account-close"
              type="button"
              onClick={() => setShowAccount(false)}
              aria-label="Close account popup"
            >
              ×
            </button>

            <h2>
              {accountMode === 'login'
                ? 'Welcome to ShopEase'
                : 'Create Your Account'}
            </h2>

            <p>
              {accountMode === 'login'
                ? 'Sign in to your account'
                : 'Join ShopEase today'}
            </p>

            <form onSubmit={handleAccountSubmit}>
              {accountMode === 'register' && (
                <>
                  <label htmlFor="register-name">
                    Full Name
                  </label>

                  <input
                    id="register-name"
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    required
                  />
                </>
              )}

              <label htmlFor="account-email">
                Email Address
              </label>

              <input
                id="account-email"
                type="email"
                name="email"
                placeholder="Enter your email"
                required
              />

              <label htmlFor="account-password">
                Password
              </label>

              <input
                id="account-password"
                type="password"
                name="password"
                placeholder="Enter your password"
                minLength={8}
                required
              />

              {accountMode === 'register' && (
                <>
                  <label htmlFor="confirm-password">
                    Confirm Password
                  </label>

                  <input
                    id="confirm-password"
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    minLength={8}
                    required
                  />
                </>
              )}

              <button
                type="submit"
                className="checkout-button"
              >
                {accountMode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
              </button>
            </form>

            <p className="account-register">
              {accountMode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}

              <button
                type="button"
                onClick={() =>
                  setAccountMode((previousMode) =>
                    previousMode === 'login'
                      ? 'register'
                      : 'login'
                  )
                }
              >
                {accountMode === 'login'
                  ? 'Create Account'
                  : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* HERO BANNER */}
      <section className="hero-banner" id="home">
        <div className="hero-copy">
          <p className="hero-eyebrow">NEW ARRIVALS</p>

          <h1>
            Latest Electronics
            <br />
            Up to <span>50% Off</span>
          </h1>

          <p className="hero-description">
            Smart gadgets for a smarter you.
          </p>

          <button
            className="shop-now-button"
            onClick={() =>
              document
                .getElementById('featured')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            Shop Now <span>→</span>
          </button>
        </div>

        <div className="hero-art">
          <img
            className="hero-banner-image"
            src="https://coolvikalp.com/wp-content/uploads/2026/08/coolvikalp-hero.png"
            alt="Laptop and electronics"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              mixBlendMode: 'multiply',
            }}
          />

          <div className="hero-fallback">
            <span>💻</span>
            <span>🎧</span>
            <span>⌚</span>
          </div>

          <div className="hero-dots">
            <span className="active-dot" />
            <span />
            <span />
          </div>
        </div>
      </section>

      {/* CATEGORY SHORTCUTS */}
      <section className="category-shortcuts">
        {categories.map((category) => (
          <button
            key={category.id}
            className="category-shortcut"
            onClick={() =>
              handleCategoryClick(category.id)
            }
          >
            <div
              className={`category-icon ${category.color}`}
            >
              <span>{category.icon}</span>
            </div>

            <span className="category-shortcut-name">
              {category.name}
            </span>
          </button>
        ))}
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="products-section" id="featured">
        <div className="products-heading">
          <h2>
            {searchTerm
              ? 'Search Results'
              : selectedCategory === 'all-categories'
                ? 'Featured Products'
                : categories.find(
                    (category) =>
                      category.id === selectedCategory
                  )?.name || 'Featured Products'}
          </h2>

          <button
            className="view-all-button"
            onClick={() => {
              setSelectedCategory('all-categories');
              setSearchTerm('');
            }}
          >
            View All <span>→</span>
          </button>
        </div>

        {loading && (
          <div className="products-status">
            <div className="loading-spinner" />
            <p>Loading products...</p>
          </div>
        )}

        {!loading && error && (
          <div className="products-status error-state">
            <p>{error}</p>
            <button onClick={fetchProducts}>
              Try Again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          filteredProducts.length === 0 && (
            <div className="empty-products">
              <span>🔎</span>
              <h3>No products found</h3>
              <p>
                Try another search or browse all categories.
              </p>

              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all-categories');
                }}
              >
                View All Products
              </button>
            </div>
          )}

        {!loading &&
          !error &&
          filteredProducts.length > 0 && (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article
                  className="product-card"
                  key={product.id}
                >
                  <div className="product-image-wrap">
                    {product.imageUrl ? (
                      <img
                        className="product-image"
                        src={product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            'none';

                          const placeholder =
                            event.currentTarget
                              .nextElementSibling;

                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}

                    <div
                      className="product-image-placeholder"
                      style={{
                        display: product.imageUrl
                          ? 'none'
                          : 'flex',
                      }}
                    >
                      🛍️
                    </div>
                  </div>

                  <div className="product-card-content">
                    <h3 title={product.name}>
                      {product.name}
                    </h3>

                    <div className="price-row">
                      <span className="product-price">
                        ₹{formatPrice(product.price)}
                      </span>

                      {product.originalPrice &&
                        Number(product.originalPrice) >
                          Number(product.price) && (
                          <>
                            <span className="original-price">
                              ₹
                              {formatPrice(
                                product.originalPrice
                              )}
                            </span>

                            <span className="discount-badge">
                              {Math.round(
                                ((Number(
                                  product.originalPrice
                                ) -
                                  Number(product.price)) /
                                  Number(
                                    product.originalPrice
                                  )) *
                                  100
                              )}
                              % OFF
                            </span>
                          </>
                        )}
                    </div>

                    <button
                      className="view-details-button"
                      onClick={() =>
                        setSelectedProduct(product)
                      }
                    >
                      View Details
                    </button>

                    <button
                      className="add-cart-button"
                      onClick={() => addToCart(product)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
                      </svg>

                      Add to Cart
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
      </section>

      {/* PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div
          className="details-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedProduct(null);
            }
          }}
        >
          <div className="details-modal">
            <button
              className="details-close"
              onClick={() => setSelectedProduct(null)}
            >
              ×
            </button>

            {selectedProduct.imageUrl && (
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="details-image"
              />
            )}

            <div className="details-content">
              <p className="details-category">
                {selectedProduct.category}
              </p>

              <h2>{selectedProduct.name}</h2>

              <p className="details-description">
                {selectedProduct.description ||
                  'No description available for this product.'}
              </p>

              <h3>
                ₹{formatPrice(selectedProduct.price)}
              </h3>

              <button
                className="add-cart-button"
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {showCart && (
        <div
          className="cart-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeCart();
            }
          }}
        >
          <aside className="cart-drawer">
            <div className="cart-drawer-header">
              <div>
                <h2>
                  {showCheckout
                    ? orderSuccess
                      ? 'Order Confirmation'
                      : 'Checkout'
                    : 'Shopping Cart'}
                </h2>

                <p>
                  {showCheckout
                    ? orderSuccess
                      ? 'Your order has been placed'
                      : 'Enter your delivery details'
                    : `${cartCount} item(s) in your cart`}
                </p>
              </div>

              <button
                className="close-cart-button"
                onClick={closeCart}
                aria-label="Close cart"
              >
                ×
              </button>
            </div>

            {/* CART CONTENT */}
            {!showCheckout && (
              <>
                {cart.length === 0 ? (
                  <div className="empty-cart">
                    <span>🛒</span>
                    <h3>Your cart is empty</h3>
                    <p>Add products to get started.</p>

                    <button
                      className="checkout-button"
                      onClick={closeCart}
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="cart-items">
                      {cart.map((product) => (
                        <div
                          className="cart-item"
                          key={product.id}
                        >
                          {product.imageUrl ? (
                            <img
                              className="cart-item-image"
                              src={product.imageUrl}
                              alt={product.name}
                            />
                          ) : (
                            <div className="cart-item-image cart-placeholder">
                              🛍️
                            </div>
                          )}

                          <div className="cart-item-info">
                            <h3>{product.name}</h3>

                            <p className="cart-item-price">
                              ₹{formatPrice(product.price)}
                            </p>

                            <div className="quantity-control">
                              <button
                                onClick={() =>
                                  decreaseQuantity(product.id)
                                }
                                aria-label="Decrease quantity"
                              >
                                −
                              </button>

                              <span>{product.quantity}</span>

                              <button
                                onClick={() =>
                                  increaseQuantity(product.id)
                                }
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <button
                            className="remove-item"
                            onClick={() =>
                              removeFromCart(product.id)
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="cart-summary">
                      <div className="cart-total-row">
                        <span>Total</span>
                        <strong>
                          ₹{formatPrice(totalAmount)}
                        </strong>
                      </div>

                      <p>
                        Delivery charges, if any, are calculated
                        separately.
                      </p>

                      <button
                        className="checkout-button"
                        onClick={() => {
                          if (!loggedInEmail) {
                            setAccountMode('login');
                            setShowAccount(true);
                            return;
                          }

                          setOrderSuccess(null);
                          setShowCheckout(true);
                          setOrderMessage('');
                        }}
                      >
                        Proceed to Checkout
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* CHECKOUT AND ORDER SUCCESS */}
            {showCheckout && (
              orderSuccess ? (
                <div className="order-success-screen">
                  <div className="success-icon">✓</div>

                  <h2>Order Placed Successfully!</h2>

                  <p>
                    Thank you for shopping with ShopEase.
                    Your order has been confirmed.
                  </p>

                 <div className="success-order-details">
  <p>
    <strong>Order ID:</strong>{' '}
    #{orderSuccess.id}
  </p>

  <p>
    <strong>Status:</strong>{' '}
    {orderSuccess.status}
  </p>

  <p>
    <strong>Total Amount:</strong>{' '}
    ₹{formatPrice(orderSuccess.totalAmount)}
  </p>

  <p>
    <strong>Order Date:</strong>{' '}
    {orderSuccess.orderDate
      ? new Date(orderSuccess.orderDate).toLocaleString(
          'en-IN',
          {
            dateStyle: 'medium',
            timeStyle: 'short',
          }
        )
      : 'Not available'}
  </p>
</div>

                  <button
                    type="button"
                    className="checkout-button"
                    onClick={() => {
                      setOrderSuccess(null);
                      setShowCheckout(false);
                      setShowCart(false);
                      setShowOrders(true);
                    }}
                  >
                    View My Orders
                  </button>

                  <button
                    type="button"
                    className="back-to-cart-button"
                    style={{
                      width: '100%',
                      marginTop: '10px',
                    }}
                    onClick={() => {
                      setOrderSuccess(null);
                      setShowCheckout(false);
                      setShowCart(false);
                    }}
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  <h3>Delivery Details</h3>

                  <form onSubmit={handlePlaceOrder}>
                    <label htmlFor="fullName">
                      Full Name
                    </label>

                    <input
                      id="fullName"
                      type="text"
                      name="fullName"
                      placeholder="Enter your full name"
                      required
                    />

                    <label htmlFor="email">
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      name="email"
                      defaultValue={loggedInEmail}
                      placeholder="Enter your email"
                      required
                    />

                    <label htmlFor="phone">
                      Phone Number
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      placeholder="Enter 10-digit mobile number"
                      pattern="[6-9][0-9]{9}"
                      maxLength={10}
                      required
                    />

                    <label htmlFor="address">
                      Delivery Address
                    </label>

                    <textarea
                      id="address"
                      name="address"
                      placeholder="Enter your full address"
                      rows="3"
                      required
                    />

                    <label htmlFor="city">City</label>

                    <input
                      id="city"
                      type="text"
                      name="city"
                      placeholder="Enter your city"
                      required
                    />

                    <label htmlFor="pinCode">
                      PIN Code
                    </label>

                    <input
                      id="pinCode"
                      type="text"
                      name="pinCode"
                      placeholder="6-digit PIN code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                    />

                    <div className="checkout-total">
                      <span>Order Total</span>
                      <strong>
                        ₹{formatPrice(totalAmount)}
                      </strong>
                    </div>

                    <button
                      type="submit"
                      className="checkout-button"
                      disabled={
                        cart.length === 0 || placingOrder
                      }
                    >
                      {placingOrder
                        ? 'Placing Order...'
                        : 'Place Order'}
                    </button>
                  </form>

                  <button
                    type="button"
                    className="back-to-cart-button"
                    disabled={placingOrder}
                    onClick={() => {
                      setShowCheckout(false);
                      setOrderMessage('');
                    }}
                    style={{
                      width: '100%',
                      marginTop: '10px',
                    }}
                  >
                    Back to Cart
                  </button>

                  {orderMessage && (
                    <p
                      className={`order-message ${
                        orderMessage.startsWith('Unable')
                          ? 'error-order-message'
                          : ''
                      }`}
                    >
                      {orderMessage}
                    </p>
                  )}
                </>
              )
            )}
          </aside>
        </div>
      )}

      {/* MY ORDERS */}
      {showOrders && (
        <Orders
          onClose={() => setShowOrders(false)}
          email={loggedInEmail}
        />
      )}

      {/* ADMIN DASHBOARD */}
      {showAdmin && isAdmin && (
        <AdminDashboard
          onClose={() => setShowAdmin(false)}
          onProductsChanged={fetchProducts}
        />
      )}

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-brand">
          Shop<span>Ease</span>
        </div>

        <p>
          Your one-stop shop for everything you love.
        </p>

        <small>
          © {new Date().getFullYear()} ShopEase.
          All rights reserved.
        </small>
      </footer>
    </div>
  );
}

export default App;