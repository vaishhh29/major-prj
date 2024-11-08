import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc, addDoc } from "firebase/firestore";
import { auth, firestore } from "./firebaseConfig";
import './Wishlist.css'; // Import custom CSS for styling

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      const user = auth.currentUser; // Get the current authenticated user
      if (user) {
        try {
          // Fetch wishlist items from the 'wishlists' collection
          const wishlistRef = collection(firestore, "wishlists");
          const wishlistSnapshot = await getDocs(wishlistRef);
          const items = wishlistSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter(item => item.uid === user.uid); // Filter items by current user's uid
          setWishlistItems(items);
        } catch (err) {
          setError("Failed to fetch wishlist items");
          console.error("Error fetching wishlist:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setError("No user is signed in.");
      }
    };

    fetchWishlist();
  }, []);

  // Remove item from wishlist
  const handleRemoveItem = async (itemId) => {
    try {
      await deleteDoc(doc(firestore, "wishlists", itemId)); // Delete item from Firestore
      setWishlistItems((prevItems) => prevItems.filter(item => item.id !== itemId)); // Update state
    } catch (err) {
      console.error("Error removing item:", err);
    }
  };

  // Handle individual checkout and save orders
  const handleCheckout = async (item) => {
    const user = auth.currentUser; // Get the current authenticated user
    if (!user) {
      alert("You need to log in to proceed to checkout.");
      return;
    }

    try {
      const ordersRef = collection(firestore, "orders");
      const order = {
        uid: user.uid,
        email: user.email,
        dressId: item.id,
        color: item.color,
        pattern: item.pattern,
        size: item.size,
        price: item.price,
        imagePath: item.imagePath,
        timestamp: new Date(),
      };

      // Save the order to the "orders" collection
      await addDoc(ordersRef, order);

      // Optionally remove item from wishlist after successful order
      await deleteDoc(doc(firestore, "wishlists", item.id));
      setWishlistItems((prevItems) => prevItems.filter(i => i.id !== item.id)); // Update state
      alert("Your order for the dress has been placed successfully!");
    } catch (err) {
      console.error("Error placing order:", err);
      alert("Failed to place order. Please try again.");
    }
  };

  if (loading) return <div className="loading">Loading your wishlist...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="wishlist-container">
      <h2 className="wishlist-title">Your Wishlist</h2>
      {wishlistItems.length > 0 ? (
        <div className="wishlist-grid">
          {wishlistItems.map((item) => (
            <div key={item.id} className="wishlist-item">
              <div className="wishlist-item-image-container">
                <img src={`http://localhost:5000${item.imagePath}`} alt={item.color} className="wishlist-item-image" />
              </div>
              <div className="wishlist-item-details">
                <h3 className="dress-name">{item.color} Dress</h3>
                <p className="dress-info">Pattern: {item.pattern}</p>
                <p className="dress-info">Size: {item.size}</p>
                <p className="dress-info">Price: ${item.price.toFixed(2)}</p>
                <div className="button-container">
                  <button className="remove-button" onClick={() => handleRemoveItem(item.id)}>Remove</button>
                  <button className="checkout-button" onClick={() => handleCheckout(item)}>Proceed to Checkout</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Your wishlist is empty.</p>
      )}
    </div>
  );
};

export default Wishlist;
