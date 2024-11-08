const mongoose = require('mongoose');

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

module.exports = Feedback;
