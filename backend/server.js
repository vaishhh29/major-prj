const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connections
mongoose.connect('mongodb://localhost:27017/user', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connect('mongodb://localhost:27017/dresses', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema and Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Dress Schema and Model
const dressSchema = new mongoose.Schema({
  color: String,
  pattern: String,
  size: String,
  price: Number,
  imagePath: String,
});

const Dress = mongoose.model('Dress', dressSchema);

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

// Signup endpoint
app.post('/signup', async (req, res) => {
  console.log('Signup request received:', req.body); // Log request body
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully.' });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ error: `An error occurred: ${err.message}` });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: `An error occurred: ${err.message}` });
  }
});

// API endpoint to upload image and store dress data
app.post('/upload', upload, async (req, res) => {
  const { color, pattern, size, price } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded.' });
  }

  const dress = new Dress({
    color,
    pattern,
    size,
    price,
    imagePath: `/uploads/${req.file.filename}`
  });

  try {
    await dress.save();
    res.status(201).json(dress);
  } catch (err) {
    console.error('Error saving dress:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// API endpoint for searching dresses
app.post('/search-dresses', async (req, res) => {
  const { color, pattern, size, price } = req.body;
  const searchQuery = {};
  if (color) searchQuery.color = color;
  if (pattern) searchQuery.pattern = pattern;
  if (size) searchQuery.size = size;
  if (price) searchQuery.price = price;

  try {
    const dresses = await Dress.find(searchQuery);
    res.json(dresses);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// OpenAI API setup
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// AI Chatbot endpoint
app.post('/chatbot', async (req, res) => {
  const { userMessage } = req.body;

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: userMessage }],
    });

    const aiResponse = completion.data.choices[0].message.content;
    res.json({ reply: aiResponse });
  } catch (error) {
    console.error('Error interacting with OpenAI:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
