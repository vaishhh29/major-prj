import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Home.css';

const Home = () => {
    const [dresses, setDresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      const fetchDresses = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/recommended-dresses'); // Adjust the URL as needed
          setDresses(response.data);
        } catch (err) {
          setError('Failed to fetch dresses');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchDresses();
    }, []);
  
    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;
  
    return (
      <div>
        <h2>Recommended Dresses</h2>
        <div className="dresses-container">
          {dresses.map(dress => (
            <div key={dress._id} className="dress-card">
              <img src={`http://localhost:5000${dress.imagePath}`} alt={dress.Name || 'Dress'} />
              <h3>{dress.Name || 'Dress'}</h3>
              <p>Color: {dress.color}</p>
              <p>Pattern: {dress.pattern}</p>
              <p>Size: {dress.size}</p>
              <p className="price">Price: ${dress.price}</p>
            </div>
          ))}
        </div>
      </div>
    );
};

export default Home;
