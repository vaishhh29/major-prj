// Modal.js
import React from 'react';
import './modal.css'; // Create a CSS file for styling the modal

const Modal = ({ isOpen, onClose, onUpdate, newAddress, setNewAddress, newPhoneNumber, setNewPhoneNumber }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4>Edit Order</h4>
        <label>
          New Address:
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
          />
        </label>
        <label>
          New Phone Number:
          <input
            type="text"
            value={newPhoneNumber}
            onChange={(e) => setNewPhoneNumber(e.target.value)}
          />
        </label>
        <button onClick={onUpdate}>Update Order</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default Modal;
