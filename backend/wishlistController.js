const mongoose = require('mongoose');
const Dress = require('./models/dressModel'); // Import the Dress model
const Wishlist = require('./models/wishlistModel'); // Import the Wishlist model

const addToWishlist = async (userEmail, dressId) => {
  try {
    // Find the dress by ID
    const dress = await Dress.findById(dressId);

    if (!dress) {
      throw new Error('Dress not found');
    }

    // Check if the item is already in the wishlist
    const existingItem = await Wishlist.findOne({ userEmail, dressId });

    if (existingItem) {
      throw new Error('Dress is already in the wishlist');
    }

    // Create a new wishlist entry
    const newWishlistItem = new Wishlist({
      userEmail,
      dressId,
      dressDetails: {
        color: dress.color,
        pattern: dress.pattern,
        size: dress.size,
        price: dress.price,
        imagePath: dress.imagePath,
      },
    });

    // Save to the database
    const savedItem = await newWishlistItem.save();
    return savedItem;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  addToWishlist,
};
