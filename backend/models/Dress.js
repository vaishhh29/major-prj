const mongoose = require('mongoose');

const dressSchema = new mongoose.Schema({
  color: String,
  pattern: String,
  size: String,
  price: Number,
  imagePath: String,
});

const Dress = mongoose.model('Dress', dressSchema);

module.exports = Dress;
