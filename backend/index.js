const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require('./firebaseServiceAccountKey.json')),
});
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schemas and models
const dressSchema = new mongoose.Schema({
  color: String,
  pattern: String,
  size: String,
  price: Number,
  imagePath: String,
});

const Dress = mongoose.model('Dress', dressSchema);

const feedbackSchema = new mongoose.Schema({
  dressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dress',
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  feedback: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage }).single('image');

// Serve images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API endpoint to upload image and store dress data
app.post('/upload', upload, async (req, res) => {
  const { color, pattern, size, price,seller } = req.body;

  if (!req.file) {
    return res.status(400).send('No image uploaded.');
  }

  try {
    const newDress = new Dress({
      color,
      pattern,
      size,
      price,
      seller,
      
    });

    const savedDress = await newDress.save();
    res.status(201).json(savedDress);
  } catch (err) {
    console.error('Error saving dress:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// API endpoint for searching dresses
app.post('/search-dresses', async (req, res) => {
  const { color, pattern, size, price } = req.body;

  // Build the search query
  const searchQuery = {};
  if (color) searchQuery.color = color;
  if (pattern) searchQuery.pattern = pattern;
  if (size) searchQuery.size = size;
  if (price) searchQuery.price = price;

  try {
    // Perform the search query in MongoDB
    const dresses = await Dress.find(searchQuery);

    if (dresses.length === 0) {
      return res.status(404).json({ message: 'No dresses found matching your search criteria.' });
    }

    res.status(200).json(dresses);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// API endpoint to add a dress to the user's wishlist
app.post('/add-to-wishlist', async (req, res) => {
  const { userId, dressId } = req.body;

  if (!userId || !dressId) {
    return res.status(400).send('Missing userId or dressId');
  }

  try {
    const wishlistRef = db.collection('wishlists').doc(userId);

    // Get the current wishlist
    const doc = await wishlistRef.get();
    let wishlist = doc.exists ? doc.data().dresses : [];

    // Check if the dress is already in the wishlist
    if (wishlist.includes(dressId)) {
      return res.status(400).send('Dress is already in the wishlist');
    }

    // Add the dress to the wishlist
    wishlist.push(dressId);
    await wishlistRef.set({ dresses: wishlist });

    res.status(200).json({ userId, dresses: wishlist });
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// API endpoint to get a user's wishlist
app.get('/wishlist/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const wishlistRef = db.collection('wishlists').doc(userId);
    const doc = await wishlistRef.get();

    if (!doc.exists) {
      return res.status(404).send('Wishlist not found');
    }

    const wishlist = doc.data().dresses;

    // Fetch dress details for all items in the wishlist
    const dressesPromises = wishlist.map(dressId =>
      Dress.findById(dressId).exec()
    );
    const dresses = await Promise.all(dressesPromises);

    res.status(200).json(dresses);
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// API endpoint to submit feedback
app.post('/submit-feedback', async (req, res) => {
  const { dressId, rating, feedback, email } = req.body;

  if (!dressId || !rating || !feedback || !email) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const newFeedback = new Feedback({
      dressId,
      rating,
      feedback,
      email,
    });

    const savedFeedback = await newFeedback.save();
    res.status(201).json(savedFeedback);
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

//my account
// Example Express.js route
// Endpoint to fetch user account details
app.get('/my-account/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch user document from Firestore
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).send('User not found');
    }

    const userData = userDoc.data();
    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).send('An error occurred while retrieving user details');
  }
});



// API endpoint to fetch dress data for chatbot
app.get('/api/dress-data', async (req, res) => {
  try {
    const dresses = await Dress.find().lean();
    res.status(200).json(dresses);
  } catch (err) {
    console.error('Error fetching dress data:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// API endpoint to get a user's wishlist
app.get('/wishlist', async (req, res) => {
  const uid = req.query.uid; // User's UID passed in query parameters

  if (!uid) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const wishlistRef = collection(db, 'wishlists');
    const q = query(wishlistRef, where('uid', '==', uid));
    const querySnapshot = await getDocs(q);

    const wishlist = [];
    querySnapshot.forEach((doc) => {
      wishlist.push(doc.data());
    });

    res.json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/search-dresses', async (req, res) => {
  const { color, pattern, size, price } = req.body;

  // Build the search query dynamically based on the provided criteria
  const searchQuery = {};
  if (color) searchQuery.color = new RegExp(color, 'i');  // Case-insensitive regex for color
  if (pattern) searchQuery.pattern = new RegExp(pattern, 'i'); // Case-insensitive regex for pattern
  if (size) searchQuery.size = size; // Exact match for size
  if (price) searchQuery.price = { $lte: price }; // Less than or equal to the specified price

  try {
    const dresses = await Dress.find(searchQuery);

    if (dresses.length === 0) {
      return res.status(404).json({ message: 'No dresses found matching your search criteria.' });
    }

    res.status(200).json(dresses);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'An error occurred while fetching dresses.' });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});

// Define the route for recommended dresses
app.get('/api/recommended-dresses', async (req, res) => {
  try {
    // Assuming you want to fetch some recommended dresses logic here
    const dresses = await Dress.find(); // You can replace this with your logic for recommendations
    res.json(dresses);
  } catch (error) {
    console.error('Error fetching recommended dresses:', error); // Log the error
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
