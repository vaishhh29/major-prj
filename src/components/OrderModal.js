import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, firestore } from './firebaseConfig';
import './orderModal.css'; // Add styles for modal

const OrderModal = ({ isOpen, onClose }) => {
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrderDetails = async () => {
    const user = auth.currentUser;

    if (user) {
      try {
        const ordersRef = collection(firestore, 'orders');
        const q = query(ordersRef, where('userId', '==', user.uid));
        const ordersSnapshot = await getDocs(q);

        if (!ordersSnapshot.empty) {
          const ordersData = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          setOrderDetails(ordersData);
        } else {
          console.log("No orders found for this user.");
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to fetch order details.');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
      setError('No user is signed in.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrderDetails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Your Orders</h2>
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {orderDetails.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          orderDetails.map((order) => (
            <div key={order.id} className="order-item">
              <h4>Order ID: {order.id}</h4>
              <p>Address: {order.userDetails?.address || 'N/A'}</p>
              <p>Phone Number: {order.userDetails?.phone || 'N/A'}</p>
              <div className="order-details">
                {order.dressDetails && order.dressDetails.length > 0 ? (
                  order.dressDetails.map(dress => (
                    <div key={dress.dressId} className="order-dress">
                      <img src={`http://localhost:5000${dress.imagePath}`} alt={`${dress.color} ${dress.pattern} dress`} />
                      <p>Name: {dress.name}</p>
                      <p>Color: {dress.color}</p>
                      <p>Pattern: {dress.pattern}</p>
                      <p>Size: {dress.size}</p>
                      <p>Price: ${dress.price ? dress.price.toFixed(2) : 'N/A'}</p>
                      <p>Quantity: {dress.quantity}</p>
                    </div>
                  ))
                ) : (
                  <p>No dresses found for this order.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderModal;
