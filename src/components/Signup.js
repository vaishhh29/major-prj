// src/components/Signup.js
import React, { useState } from "react";
import { auth, firestore, googleProvider } from "./firebaseConfig";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore"; // Import getDoc
import { useNavigate } from "react-router-dom"; // Add Link for navigation
import { motion } from "framer-motion";
import "./Signup.css";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // New input for name
  const [phone, setPhone] = useState(""); // New input for phone
  const [address, setAddress] = useState(""); // New input for address
  const [pincode, setPincode] = useState(""); // New input for pincode
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(firestore, "users", userId));
      if (!userDoc.exists()) {
        // If user doesn't exist, create a new document
        await setDoc(doc(firestore, "users", userId), {
          email: email,
          name: name, // Save name
          phone: phone, // Save phone
          address: address, // Save address
          pincode: pincode, // Save pincode
          uid: userId, // Save the UID here
          password: password,
        });
      }

      navigate("/chatbot");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (!userDoc.exists()) {
        // If user doesn't exist, create a new document
        await setDoc(doc(firestore, "users", user.uid), {
          email: user.email,
          name: user.displayName, // Save name from Google
          uid: user.uid, // Save the UID here
        });
      }

      navigate("/chatbot");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <motion.div
      className="signup-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup} className="signup-form">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
        />
        <div className="two-inputs">
          <div className="input-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
        </div>
        <div className="two-inputs">
          <div className="input-group">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              required
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address"
              required
            />
          </div>
        </div>
        <input
          type="text"
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
          placeholder="Pincode"
          required
        />
        <button type="submit">Sign Up</button>
        {error && <p className="error">{error}</p>}
        <button onClick={handleGoogleSignUp} className="google-signup">
        Sign up with Google
      </button>
      <p>
        Already have an account? <a href="/" className="login-link">Log In</a>
      </p>
      </form>
     
    </motion.div>
  );
};

export default Signup;
