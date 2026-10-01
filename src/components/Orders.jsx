import { useCallback, useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const ORDER_STAGES = [
  "PLACED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

function formatStatus(status) {
  if (!status) return "PLACED";

  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatOrderDate(date) {
  if (!date) return "Date unavailable";

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

function OrderProgress({ status }) {
  const currentStatus = status || "PLACED";
  const currentIndex = ORDER_STAGES.indexOf(currentStatus);

  if (currentStatus === "CANCELLED") {
    return (
      <div className="order-progress cancelled">
        <span className="progress-icon">✕</span>

        <div>
          <strong>Order Cancelled</strong>
          <p>This order has been cancelled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-progress">
      {ORDER_STAGES.map((stage, index) => {
        const isCompleted = index <= currentIndex;

        return (
          <div
            className={`progress-step ${
              isCompleted ? "completed" : ""
            }`}
            key={stage}
          >
            <div className="progress-marker">
              {isCompleted ? "✓" : index + 1}
            </div>

            <span>{formatStatus(stage)}</span>

            {index < ORDER_STAGES.length - 1 && (
              <div
                className={`progress-line ${
                  index < currentIndex ? "completed" : ""
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Orders({ onClose, email }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Get the JWT token saved during login
      const token = localStorage.getItem("jwtToken");

      if (!token) {
        throw new Error("Please log in to view your orders.");
      }

      // Fetch orders belonging to the logged-in user
      const response = await fetch(
        `${API_URL}/orders/my-orders`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Display the actual backend error when available
      if (!response.ok) {
        const message = await response.text();

        console.error("Orders API error:", {
          status: response.status,
          message,
        });

        throw new Error(
          message || `Failed to fetch orders (${response.status})`
        );
      }

      const data = await response.json();

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching orders:", error);

      setError(error.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, email]);

  return (
    <div className="orders-container">
      {/* Header */}
      <div className="orders-header">
        <div>
          <h2>My Orders</h2>
          <p>View your order details and delivery status.</p>
        </div>

        <div className="orders-actions">
          <button
            type="button"
            className="refresh-orders-button"
            onClick={fetchOrders}
            disabled={loading}
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            className="back-to-cart-button"
            onClick={onClose}
          >
            ← Back to Shop
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="orders-status">
          <p>Loading orders...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="orders-status error-state">
          <p>{error}</p>

          <button
            type="button"
            onClick={fetchOrders}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty orders */}
      {!loading && !error && orders.length === 0 && (
        <div className="orders-empty">
          <span>📦</span>

          <h3>No orders found</h3>

          <p>
            Your orders will appear here after you place an order.
          </p>

          <button
            type="button"
            className="checkout-button"
            onClick={onClose}
          >
            Start Shopping
          </button>
        </div>
      )}

      {/* Orders list */}
      {!loading && !error && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => {
            const status = order.status || "PLACED";

            return (
              <div
                className="order-card"
                key={order.id}
              >
                {/* Order header */}
                <div className="order-card-header">
                  <div>
                    <h3>Order #{order.id}</h3>

                    <p className="order-subtitle">
                      Placed on: {formatOrderDate(order.orderDate)}
                    </p>
                  </div>

                  <span
                    className={`order-status status-${status.toLowerCase()}`}
                  >
                    {formatStatus(status)}
                  </span>
                </div>

                {/* Order progress */}
                <OrderProgress status={status} />

                {/* Order details */}
                <div className="order-details">
                  <p>
                    <strong>Name:</strong> {order.fullName}
                  </p>

                  <p>
                    <strong>Email:</strong> {order.email}
                  </p>

                  <p>
                    <strong>Phone:</strong> {order.phone}
                  </p>

                  <p>
                    <strong>Delivery Address:</strong>{" "}
                    {order.address}, {order.city} - {order.pinCode}
                  </p>
                </div>

                {/* Order total */}
                <div className="order-total">
                  <span>Total Amount</span>

                  <strong>
                    ₹{formatPrice(order.totalAmount)}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Orders;