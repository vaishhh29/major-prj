import React, { useEffect, useState } from 'react';
import { auth, firestore } from './firebaseConfig'; // Import Firebase auth and Firestore
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './Account.css'; // Import custom CSS for styling

const Account = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({});

  useEffect(() => {
    const fetchAccountDetails = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          // Get user document from Firestore
          const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser(userData);
            setUpdatedUser(userData);
          } else {
            console.error('No such user document found in Firestore!');
          }
        } catch (error) {
          console.error('Error fetching account details:', error);
        }
      } else {
        console.error('No authenticated user found!');
      }
      setLoading(false);
    };

    fetchAccountDetails();
  }, []);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        // Update user document in Firestore
        await updateDoc(doc(firestore, 'users', currentUser.uid), updatedUser);
        setUser(updatedUser);
        setIsEditing(false); // Exit edit mode
        alert('Account details updated successfully!');
      } catch (error) {
        console.error('Error updating account details:', error);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUser({ ...updatedUser, [name]: value });
  };

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <div className="no-data">No user data found.</div>;

  return (
    <div className="account-container">
      <div className="account-card">
        <h3 className="account-title">Account Details</h3>

        <div className="account-field">
          <label>Name:</label>
          {isEditing ? (
            <input type="text" name="name" value={updatedUser.name || ''} onChange={handleChange} />
          ) : (
            <p>{user.name || 'N/A'}</p>
          )}
        </div>

        <div className="account-field">
          <label>Email:</label>
          <p>{user.email || 'N/A'}</p> {/* Email should not be editable */}
        </div>

        <div className="account-field">
          <label>Address:</label>
          {isEditing ? (
            <input type="text" name="address" value={updatedUser.address || ''} onChange={handleChange} />
          ) : (
            <p>{user.address || 'N/A'}</p>
          )}
        </div>

        <div className="account-field">
          <label>Phone:</label>
          {isEditing ? (
            <input type="text" name="phone" value={updatedUser.phone || ''} onChange={handleChange} />
          ) : (
            <p>{user.phone || 'N/A'}</p>
          )}
        </div>

        <div className="account-field">
          <label>Pincode:</label>
          {isEditing ? (
            <input type="text" name="pincode" value={updatedUser.pincode || ''} onChange={handleChange} />
          ) : (
            <p>{user.pincode || 'N/A'}</p>
          )}
        </div>

        <div className="account-field">
          <label>Password</label>
          {isEditing ? (
            <input type="text" name="password" value={updatedUser.password || ''} onChange={handleChange} />
          ) : (
            <p>{user.password || 'N/A'}</p>
          )}
        </div>

        <div className="account-buttons">
          {isEditing ? (
            <button className="save-button" onClick={handleSaveClick}>Save</button>
          ) : (
            <button className="edit-button" onClick={handleEditClick}>Edit</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Account;
