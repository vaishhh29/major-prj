// src/components/NavigationBar.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaComments, FaHeart, FaUser, FaBoxOpen } from 'react-icons/fa';
import './NavigationBar.css'; 
import { auth } from './firebaseConfig';
const NavigationBar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location
  const [activeMenu, setActiveMenu] = useState('/home'); // Default active menu

  useEffect(() => {
    setActiveMenu(location.pathname); // Update active menu based on the current path
  }, [location]);

  const handleLogout = async () => {
    await auth.signOut();
    if (onLogout) onLogout(); // Call the logout function passed from App.js
    navigate("/login"); // Navigate back to login after logout
  };

  return (
    <div className="navigation-bar">
      <button onClick={() => navigate('/home')} className={activeMenu === '/home' ? 'active' : ''}>
        <FaHome /> Home
      </button>
      <button onClick={() => navigate('/chatbot')} className={activeMenu === '/chatbot' ? 'active' : ''}>
        <FaComments /> Chatbot
      </button>
      <button onClick={() => navigate('/wishlist')} className={activeMenu === '/wishlist' ? 'active' : ''}>
        <FaHeart /> Wishlist
      </button>
      <button onClick={() => navigate('/account')} className={activeMenu === '/account' ? 'active' : ''}>
        <FaUser /> Account
      </button>
      <button onClick={() => navigate('/orders')} className={activeMenu === '/orders' ? 'active' : ''}>
        <FaBoxOpen /> Orders
      </button>
      <button onClick={handleLogout}>Logout</button> {/* Logout button */}
    </div>
  );
};

export default NavigationBar;
