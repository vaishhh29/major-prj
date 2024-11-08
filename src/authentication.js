import { auth, db, googleProvider } from './firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Sign up with email and password
export const signUpWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store additional user info in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
    });

    console.log('User signed up and data stored:', user);
  } catch (error) {
    console.error('Error signing up:', error);
  }
};

// Sign in with email and password
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('User logged in:', user);
  } catch (error) {
    console.error('Error logging in:', error);
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Store user info in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
    });

    console.log('User signed in with Google and data stored:', user);
  } catch (error) {
    console.error('Error signing in with Google:', error);
  }
};
