import { useState, useEffect } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const ORDER_STATUSES = [
  "PLACED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function AdminDashboard({ onClose, onProductsChanged }) {
  // =========================
  // PRODUCT STATES
  // =========================
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  // =========================
  // ORDER STATES
  // =========================
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderMessage, setOrderMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Search, filter, and pagination
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const ordersPerPage = 5;

  // =========================
  // PRODUCT FORM STATE
  // =========================
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    category: "",
  });

  const token = localStorage.getItem("jwtToken");

  // =========================
  // FORMAT ORDER DATE
  // =========================
  function formatOrderDate(date) {
    if (!date) {
      return "Date unavailable";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // =========================
  // LOAD PRODUCTS
  // =========================
  async function fetchProducts() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/products`);

      if (!response.ok) {
        throw new Error("Unable to load products");
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // LOAD ALL ORDERS
  // =========================
  async function fetchOrders() {
    try {
      setOrdersLoading(true);
      setOrderMessage("");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        `${API_URL}/orders/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || `Unable to load orders (${response.status})`
        );
      }

      const data = await response.json();

      setOrders(data);
      setCurrentPage(1);
    } catch (error) {
      setOrderMessage(error.message);
    } finally {
      setOrdersLoading(false);
    }
  }

  // =========================
  // LOAD DATA WHEN COMPONENT MOUNTS
  // =========================
  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  // =========================
  // HANDLE PRODUCT FORM CHANGES
  // =========================
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =========================
  // ADD OR UPDATE PRODUCT
  // =========================
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("Please log in again.");
      return;
    }

    const product = {
      ...formData,
      price: Number(formData.price),
    };

    const url = editingId
      ? `${API_URL}/products/${editingId}`
      : `${API_URL}/products`;

    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || "Failed to save product"
        );
      }

      setMessage(
        editingId
          ? "Product updated successfully!"
          : "Product added successfully!"
      );

      resetForm();

      await fetchProducts();

      if (onProductsChanged) {
        onProductsChanged();
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  // =========================
  // EDIT PRODUCT
  // =========================
  function handleEdit(product) {
    setEditingId(product.id);

    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      imageUrl: product.imageUrl || "",
      category: product.category || "",
    });

    setMessage("");
  }

  // =========================
  // DELETE PRODUCT
  // =========================
  async function handleDelete(productId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    if (!token) {
      setMessage("Please log in again.");
      return;
    }

    try {
      setMessage("");

      const response = await fetch(
        `${API_URL}/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || "Failed to delete product"
        );
      }

      setMessage("Product deleted successfully!");

      await fetchProducts();

      if (onProductsChanged) {
        onProductsChanged();
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  // =========================
  // RESET PRODUCT FORM
  // =========================
  function resetForm() {
    setEditingId(null);

    setFormData({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      category: "",
    });
  }

  // =========================
  // UPDATE ORDER STATUS
  // =========================
  async function handleOrderStatusChange(orderId, newStatus) {
    if (!token) {
      setOrderMessage("Please log in again.");
      return;
    }

    try {
      setUpdatingOrderId(orderId);
      setOrderMessage("");

      const response = await fetch(
        `${API_URL}/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText ||
            `Failed to update order (${response.status})`
        );
      }

      const updatedOrder = await response.json();

      // Update the changed order in React state
      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.id === orderId ? updatedOrder : order
        )
      );

      setOrderMessage(
        `Order #${orderId} updated to ${newStatus} successfully!`
      );
    } catch (error) {
      setOrderMessage(error.message);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  // =========================
  // SEARCH AND FILTER ORDERS
  // =========================
  const filteredOrders = orders.filter((order) => {
    const search = orderSearch.trim().toLowerCase();

    const matchesSearch =
      String(order.id).includes(search) ||
      (order.fullName || "").toLowerCase().includes(search) ||
      (order.email || "").toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "ALL" ||
      (order.status || "PLACED") === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // =========================
  // PAGINATION
  // =========================
  // Keep at least one page when there are no matching orders.
  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ordersPerPage)
  );

  const startIndex = (currentPage - 1) * ordersPerPage;

  const paginatedOrders = filteredOrders.slice(
    startIndex,
    startIndex + ordersPerPage
  );

  // =========================
  // JSX
  // =========================
  return (
    <div className="admin-overlay">
      <div className="admin-dashboard">

        {/* HEADER */}
        <div className="admin-header">
          <div>
            <h2>🛠️ Admin Dashboard</h2>
            <p>Manage your ShopEase products and orders</p>
          </div>

          <button
            onClick={onClose}
            className="admin-close"
          >
            ✕
          </button>
        </div>

        <div className="admin-content">

          {/* =========================
              PRODUCT FORM
          ========================= */}
          <section className="admin-form-section">
            <h3>
              {editingId ? "Edit Product" : "Add New Product"}
            </h3>

            <form onSubmit={handleSubmit}>
              <label>Product Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />

              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product description"
                required
              />

              <label>Price (₹)</label>
              <input
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter price"
                required
              />

              <label>Image URL</label>
              <input
                name="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="Paste product image URL"
              />

              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
                <option value="Home & Living">Home & Living</option>
                <option value="Beauty">Beauty</option>
                <option value="Books">Books</option>
                <option value="Sports">Sports</option>
                <option value="Toys">Toys</option>
              </select>

              <button
                type="submit"
                className="admin-save"
              >
                {editingId ? "Update Product" : "Add Product"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="admin-cancel"
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              )}
            </form>

            {message && (
              <p className="admin-message">{message}</p>
            )}
          </section>

          {/* =========================
              PRODUCT LIST
          ========================= */}
          <section className="admin-products-section">
            <h3>Products ({products.length})</h3>

            {loading ? (
              <p>Loading products...</p>
            ) : products.length === 0 ? (
              <p>No products found.</p>
            ) : (
              <div className="admin-product-list">
                {products.map((product) => (
                  <div
                    className="admin-product"
                    key={product.id}
                  >
                    <div className="admin-product-info">
                      <strong>{product.name}</strong>
                      <span>₹{product.price}</span>
                      <small>{product.category}</small>
                    </div>

                    <div className="admin-product-actions">
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* =========================
              ORDER MANAGEMENT
          ========================= */}
          <section className="admin-orders-section">
            <h3>📦 Customer Orders ({orders.length})</h3>

            {/* SEARCH AND FILTER */}
            <div className="order-filters">
              <input
                type="text"
                placeholder="Search by order ID, name, or email"
                value={orderSearch}
                onChange={(event) => {
                  setOrderSearch(event.target.value);
                  setCurrentPage(1);
                }}
              />

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>

                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* RESULTS COUNT */}
            <p className="order-results-count">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>

            {/* REFRESH ORDERS */}
            <button
              type="button"
              onClick={fetchOrders}
              disabled={ordersLoading}
            >
              {ordersLoading ? "Refreshing..." : "Refresh Orders"}
            </button>

            {orderMessage && (
              <p className="admin-message">{orderMessage}</p>
            )}

            {/* ORDER LIST */}
            {ordersLoading ? (
              <p>Loading orders...</p>
            ) : orders.length === 0 ? (
              <p>No orders found.</p>
            ) : filteredOrders.length === 0 ? (
              <p>
                No orders match your search or selected status.
              </p>
            ) : (
              <>
                <div className="admin-order-list">
                  {paginatedOrders.map((order) => (
                    <div
                      className="admin-order"
                      key={order.id}
                    >
                      <h4>Order #{order.id}</h4>

                      <p className="admin-order-date">
                        Placed on: {formatOrderDate(order.orderDate)}
                      </p>

                      <p>
                        <strong>Customer:</strong>{" "}
                        {order.fullName}
                      </p>

                      <p>
                        <strong>Email:</strong>{" "}
                        {order.email}
                      </p>

                      <p>
                        <strong>Phone:</strong>{" "}
                        {order.phone}
                      </p>

                      <p>
                        <strong>Address:</strong>{" "}
                        {order.address}, {order.city} - {order.pinCode}
                      </p>

                      <p>
                        <strong>Total:</strong>{" "}
                        ₹{order.totalAmount}
                      </p>

                      <p>
                        <strong>Current Status:</strong>{" "}
                        {order.status || "PLACED"}
                      </p>

                      <label htmlFor={`status-${order.id}`}>
                        Update Status
                      </label>

                      <select
                        id={`status-${order.id}`}
                        value={order.status || "PLACED"}
                        disabled={updatingOrderId === order.id}
                        onChange={(event) =>
                          handleOrderStatusChange(
                            order.id,
                            event.target.value
                          )
                        }
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      {updatingOrderId === order.id && (
                        <p>Updating status...</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* PAGINATION CONTROLS */}
                <div className="order-pagination">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(1, page - 1)
                      )
                    }
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>

                  <span>
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                    disabled={currentPage >= totalPages}
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;