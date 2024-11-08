// src/components/Login.js
import React, { useState } from "react";
import { auth, googleProvider, firestore } from "./firebaseConfig";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore"; // Import getDoc
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (!userDoc.exists()) {
        // If user doesn't exist, create a new document
        await setDoc(doc(firestore, "users", user.uid), {
          email: user.email,
          uid: user.uid, // Save the UID here
        });
      }

      console.log("Logged in user details:", {
        uid: user.uid,
        email: user.email,
      });

      // Navigate to home page after successful login
      navigate("/home");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (!userDoc.exists()) {
        // If user doesn't exist, create a new document
        await setDoc(doc(firestore, "users", user.uid), {
          email: user.email,
          uid: user.uid, // Save the UID here
        });
      }

      console.log("Logged in user details:", {
        uid: user.uid,
        email: user.email,
      });

      // Navigate to home page after successful Google login
      navigate("/home");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <motion.div className="login-container">
      <h2>Login</h2>
      <form className="login-form">
        <div className="input-group">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="input-group">
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" onClick={handleLogin}>
          Login
        </button>
        <button type="button" className="google-login" onClick={handleGoogleSignIn}>
          Login with Google
        </button>
        <p>
          Don't have an account? <a href="/signup" className="signup-link">Sign up here</a>
        </p>
        {error && <div className="error">{error}</div>} {/* Display error message */}
      </form>
    </motion.div>
  );
};

export default Login;
