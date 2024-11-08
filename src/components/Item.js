// src/components/Item.js
import React from "react";
import { doc, updateDoc } from "firebase/firestore";
import { auth, firestore } from "./firebaseConfig";
import { useNavigate } from "react-router-dom";

const Item = ({ itemId, itemName, itemPrice }) => {
  const navigate = useNavigate();

  const handleAddToWishlist = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in to add items to your wishlist.");
        navigate("/login");
        return;
      }

      const wishlistRef = doc(firestore, "users", user.uid, "wishlist", itemId);
      await updateDoc(wishlistRef, { name: itemName, price: itemPrice, dateAdded: new Date() });

      alert("Item added to wishlist!");
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      alert("Failed to add item to wishlist. Please try again.");
    }
  };

  return (
    <div className="item">
      <h3>{itemName}</h3>
      <p>{itemPrice}</p>
      <button onClick={handleAddToWishlist}>Add to Wishlist</button>
    </div>
  );
};

export default Item;
