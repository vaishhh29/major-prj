import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { auth, firestore } from './firebaseConfig';
import './orders.css';
import { deleteDoc } from 'firebase/firestore';
import Modal from './Modal'; // Import the Modal component

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [newAddress, setNewAddress] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

  const fetchOrders = async () => {
    const user = auth.currentUser;

    if (user) {
      try {
        const ordersRef = collection(firestore, 'orders');
        const q = query(ordersRef, where('userId', '==', user.uid));
        const ordersSnapshot = await getDocs(q);

        if (ordersSnapshot.empty) {
          setOrders([]);
        } else {
          const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setOrders(ordersData);
        }
      } catch (error) {
        setError(`Failed to fetch orders: ${error.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
      setError('No user is signed in.');
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchOrders();
      } else {
        setLoading(false);
        setError('No user is signed in.');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = (order) => {
    setEditingOrderId(order.id);
    setNewAddress(order.address || '');
    setNewPhoneNumber(order.phone || '');
    setIsModalOpen(true); // Open the modal
  };

  const handleUpdate = async () => {
    if (editingOrderId) {
      const orderRef = doc(firestore, 'orders', editingOrderId);
      try {
        await updateDoc(orderRef, {
          address: newAddress,
          phone: newPhoneNumber,
        });
        // Optimistically update the local state
        setOrders(orders.map(order => 
          order.id === editingOrderId 
            ? { ...order, address: newAddress, phone: newPhoneNumber } 
            : order
        ));
        setIsModalOpen(false); // Close the modal
        setEditingOrderId(null);
        setNewAddress('');
        setNewPhoneNumber('');
      } catch (error) {
        setError(`Failed to update order: ${error.message}`);
      }
    }
  };

  const handleCancel = async (orderId) => {
    const orderRef = doc(firestore, 'orders', orderId);
    try {
      // Delete the document from Firestore
      await deleteDoc(orderRef);
  
      // Update the local state to remove the order from the UI
      setOrders(orders.filter(order => order.id !== orderId));
  
      console.log(`Order ${orderId} deleted successfully`);
    } catch (error) {
      setError(`Failed to cancel and delete order: ${error.message}`);
      console.error('Error deleting order:', error);
    }
  };

  if (loading) return <div className="loading">Loading your orders...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
    <h2>Your Orders</h2>
    <div className="orders">
     
      <div className="order-list">
        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-item">
              <div className="order-image">
                <img src={`http://localhost:5000${order.imagePath}`} alt={`${order.color} ${order.pattern} dress`} />
              </div>
              <div className="order-details">
                <div className="order-info">
                  <p><span>Size:</span> {order.size}</p>
                  <p className="order-price"><span>Price:</span> ${order.price ? order.price.toFixed(2) : 'N/A'}</p>
                  <p><span>Quantity:</span> {order.quantity}</p>
                
                </div>
                <div className="order-actions">
                  <p><span>Address:</span> {order.address || 'N/A'}</p>
                  <p><span>Phone Number:</span> {order.phone || 'N/A'}</p>
                  <button onClick={() => handleEdit(order)}>Edit</button>
                  <button onClick={() => handleCancel(order.id)}>Cancel Order</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for editing order */}
      <Modal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdate}
        newAddress={newAddress}
        setNewAddress={setNewAddress}
        newPhoneNumber={newPhoneNumber}
        setNewPhoneNumber={setNewPhoneNumber}
      />
    </div>
    </div>
  );
};

export default Orders;
