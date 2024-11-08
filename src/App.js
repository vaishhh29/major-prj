// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth'; // Firebase Auth for auth state
import { auth } from './components/firebaseConfig'; // Import your Firebase auth configuration
import Chatbot from './components/Chatbot';
import Login from './components/Login';
import Signup from './components/Signup';
import Wishlist from './components/Wishlist';
import FeedbackModal from './components/FeedbackModal';
import DressList from './components/DressList';
import NavigationBar from './components/NavigationBar';
import Home from './components/Home';
import Account from './components/Account';
import Orders from './components/Orders';
import OrderModal from './components/OrderModal';
import ColorRecommender from './components/ColorRecommender';
import CreditCard from './components/Creditcard';
import Modal from './components/Modal';

const App = () => {
  const [user, setUser] = useState(null); // To hold the current user state
  const [loading, setLoading] = useState(true); // To handle loading state while checking auth

  useEffect(() => {
    // Listen to Firebase authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Stop loading when we have the user data
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show loading state while checking authentication
  }

  return (
    <Router>
      <Routes>
        {/* If the user is not logged in, redirect to login page */}
       
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protect routes that require authentication */}
        <Route path="/home" element={user ? <><NavigationBar /><Home /></> : <Navigate to="/login" replace />} />
        <Route path="/chatbot" element={user ? <><NavigationBar /><Chatbot /></> : <Navigate to="/login" replace />} />
        <Route path="/wishlist" element={user ? <><NavigationBar /><Wishlist /></> : <Navigate to="/login" replace />} />
        <Route path="/dresslist" element={user ? <><NavigationBar /><DressList /></> : <Navigate to="/login" replace />} />
        <Route path="/feedbackmodal" element={user ? <><NavigationBar /><FeedbackModal /></> : <Navigate to="/login" replace />} />
        <Route path="/account" element={user ? <><NavigationBar /><Account /></> : <Navigate to="/login" replace />} />
        <Route path="/orders" element={user ? <><NavigationBar /><Orders /></> : <Navigate to="/login" replace />} />
        <Route path="/ordermodal" element={user ? <><NavigationBar /><OrderModal /></> : <Navigate to="/ordermodal" replace />} />
        <Route path="/recommend" element={user ? <><NavigationBar/><ColorRecommender/></> : <Navigate to ="/recommend" replace/>} />
        <Route path="/credit" element={user ? <><NavigationBar/><CreditCard/></> : <Navigate to ="/credit" replace/>} />
        <Route path="/edit" element={user ? <><NavigationBar/><Modal/></> : <Navigate to ="/edit" replace/>} />
      </Routes>
    </Router>
  );
};

export default App;
