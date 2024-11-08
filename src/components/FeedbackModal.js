// FeedbackModal.js
import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import './FeedbackModal.css'; // Add CSS for modal styling

const FeedbackModal = ({ isOpen, onClose, dressId }) => {
  const [rating, setRating] = useState(1);
  const [comments, setComments] = useState('');
  const [error, setError] = useState(null);
  const db = getFirestore();

  const handleSubmit = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert('You need to be logged in to submit feedback.');
      return;
    }

    const feedback = {
      dressId,
      email: user.email,
      rating,
      comments,
      timestamp: new Date(),
    };

    try {
      await addDoc(collection(db, 'dressFeedback'), feedback);
      alert('Feedback submitted successfully!');
      onClose(); // Close modal after submission
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Error submitting feedback, please try again.');
    }
  };

  return (
   
    isOpen && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Submit Feedback</h2>
          {error && <p className="error-message">{error}</p>}
          <div>
            <label>Email:</label>
            <input type="text" value={getAuth().currentUser?.email || ''} readOnly />
          </div>
          <div>
            <label>Rating:</label>
            <select value={rating} onChange={(e) => setRating(e.target.value)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <option key={star} value={star}>{star}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Comments:</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Leave your feedback..."
            />
          </div>
          <button onClick={handleSubmit}>Submit</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    )
  );
};

export default FeedbackModal;
