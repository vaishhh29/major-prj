import React, { useState } from 'react';
import axios from 'axios';

const ColorRecommender = () => {
  const [purchasedColors, setPurchasedColors] = useState([]);
  const [inputColor, setInputColor] = useState('');
  const [recommendedColors, setRecommendedColors] = useState([]);

  const handleAddColor = () => {
    setPurchasedColors([...purchasedColors, inputColor]);
    setInputColor(''); // Clear the input
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:5000/recommend-colors', {
        user_purchases: purchasedColors
      });

      setRecommendedColors(response.data.recommended_colors);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  return (
    <div>
      <h2>Color Recommender</h2>
      
      <div>
        <input 
          type="text" 
          value={inputColor}
          onChange={(e) => setInputColor(e.target.value)} 
          placeholder="Enter a color"
        />
        <button onClick={handleAddColor}>Add Color</button>
      </div>

      <div>
        <h3>Purchased Colors:</h3>
        <ul>
          {purchasedColors.map((color, index) => (
            <li key={index}>{color}</li>
          ))}
        </ul>
      </div>

      <button onClick={handleSubmit}>Get Recommendations</button>

      {recommendedColors.length > 0 && (
        <div>
          <h3>Recommended Colors:</h3>
          <ul>
            {recommendedColors.map((color, index) => (
              <li key={index}>{color}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ColorRecommender;