import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Cards from "react-credit-cards";
import "react-credit-cards/es/styles-compiled.css";
import styles from "./credit.css";

const CreditCard = () => {
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [focus, setFocus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("credit");

  const handlePayment = () => {
    alert("Order placed");
  };

  return (
    <div className="container mt-5">
      <h3>Payment Options</h3>
      <div className="payment-options text-center">
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="paymentMethod"
            id="creditCard"
            value="credit"
            checked={paymentMethod === "credit"}
            onChange={() => setPaymentMethod("credit")}
          />
          <label className="form-check-label" htmlFor="creditCard">
            Credit Card
          </label>
        </div>
        <div className="form-check form-check-inline">
          <input
            className="form-check-input"
            type="radio"
            name="paymentMethod"
            id="cashDelivery"
            value="cash"
            checked={paymentMethod === "cash"}
            onChange={() => setPaymentMethod("cash")}
          />
          <label className="form-check-label" htmlFor="cashDelivery">
            Cash on Delivery
          </label>
        </div>
      </div>

      {paymentMethod === "credit" && (
        <div className="credit-card-section">
          <div className="rccs__card rccs__card--unknown">
            <Cards
              number={number}
              name={name}
              expiry={date}
              cvc={cvc}
              focused={focus}
            />
          </div>

          <br />
          <form>
            <div className="row">
              <div className="col-sm-6">
                <label htmlFor="number">Card Number</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter Card Number"
                  value={number}
                  name="number"
                  onChange={(e) => setNumber(e.target.value)}
                  onFocus={(e) => setFocus(e.target.name)}
                />
              </div>
              <div className="col-sm-6">
                <label htmlFor="name">Card Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  placeholder="Enter Card Name"
                  name="name"
                  onChange={(e) => setName(e.target.value)}
                  onFocus={(e) => setFocus(e.target.name)}
                />
              </div>
            </div>
            <br />
            <div className="row">
              <div className="col-sm-6">
                <label htmlFor="expiry">Expiration Date</label>
                <input
                  type="text" // Changed to text to allow slashes
                  name="expiry"
                  placeholder="MM/YY"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onFocus={(e) => setFocus(e.target.name)}
                />
              </div>
              <div className="col-sm-6">
                <label htmlFor="cvc">CVV</label>
                <input
                  type="number"
                  name="cvc"
                  className="form-control"
                  placeholder="Enter CVV"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  onFocus={(e) => setFocus(e.target.name)}
                />
              </div>
            </div>
            <div className="text-center mt-4">
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handlePayment}
              >
                Pay
              </button>
            </div>
          </form>
        </div>
      )}

      {paymentMethod === "cash" && (
        <div className="text-center mt-4">
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handlePayment}
          >
            Pay
          </button>
        </div>
      )}
    </div>
  );
};

export default CreditCard;
