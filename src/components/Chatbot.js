import React, { useState, useEffect } from 'react';
import Groq from 'groq-sdk';
import { getDoc, doc, collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import './Chatbot.css';
import { useNavigate } from 'react-router-dom';


const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const Chatbot = () => {
  const navigate = useNavigate();
  const [userInput, setUserInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [dressData, setDressData] = useState([]);
  const [filteredDresses, setFilteredDresses] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const db = getFirestore();
  const [orderCounts, setOrderCounts] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});
  const [addedToWishlist, setAddedToWishlist] = useState(new Set());

  // Fetch dress data on component mount
  useEffect(() => {
    const fetchDressData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/dress-data');
        const data = await res.json();
        setDressData(data);
      } catch (err) {
        console.error('Error fetching dress data:', err);
      }
    };
    fetchDressData();
  }, []);

  // Function to filter dresses based on search query
  const filterDresses = () => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const queryParts = lowerCaseQuery.split(' ');
    let colorMatch, patternMatch, sizeMatch, priceLimit;

    queryParts.forEach((part) => {
      if (["black", "white", "pink", "blue", "yellow", "green", "red", "purple"].includes(part)) {
        colorMatch = part;
      }
      if (["solid", "striped", "floral", "plain", "checked"].includes(part)) {
        patternMatch = part;
      }
      if (["XS", "S", "M", "L", "XL", "XXL", "10 years", "5 years"].includes(part)) {
        sizeMatch = part;
      }
      if (part.includes("under")) {
        const price = part.split("under")[1];
        const parsedPrice = parseInt(price, 10);
        if (!isNaN(parsedPrice)) {
          priceLimit = parsedPrice;
        }
      }
    });

    const filtered = dressData.filter((dress) => {
      return (
        (colorMatch ? dress.color.toLowerCase() === colorMatch : true) &&
        (patternMatch ? dress.pattern.toLowerCase() === patternMatch : true) &&
        (sizeMatch ? dress.size.toLowerCase() === sizeMatch : true) &&
        (priceLimit ? dress.price <= priceLimit : true)
      );
    });

    return filtered;
  };

  // Function to handle search with validation
  const handleSearch = async () => {
    
    const query = searchQuery.trim().toLowerCase();

    // Check if the search query is empty
    if (!query) {
      displayChatbotMessage("Please enter a search query.");
      return;
    }

    // Define valid search terms
    const validColors = ["black", "white", "pink", "blue", "yellow", "green", "red", "purple"];
    const validPatterns = ["solid", "striped", "floral", "plain", "checked"];
    const validSizes = ["xs", "s", "m", "l", "xl", "xxl", "10 years", "5 years"];
    const validPrice = query.includes("under");

    const queryParts = query.split(" ");

    let hasValidQuery = false;

    // Validate that the query contains at least one valid term
    queryParts.forEach((part) => {
      if (
        validColors.includes(part) ||
        validPatterns.includes(part) ||
        validSizes.includes(part) ||
        (validPrice && !isNaN(parseInt(part.split("under")[1], 10)))
      ) {
        hasValidQuery = true;
      }
    });

    // If no valid query parts are found, display an error message
    if (!hasValidQuery) {
      displayChatbotMessage("Please enter a valid search query (e.g., color, pattern, size, price).");
      return;
    }

    // Continue with dress search if the query is valid
    const dresses = filterDresses();
    setFilteredDresses(dresses);

    const resultMessage = dresses.length
      ? `Found ${dresses.length} dress(es): ${dresses.map(d => d.color + ' ' + d.pattern).join(', ')}`
      : 'No matching dresses found.';
    displayChatbotMessage(resultMessage);
  };

  // Function to fetch prompt from Groq API
  const fetchPrompt = async () => {
    if (!userInput) {
      setError("Please enter a query...");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const systemMessage = `You are a dress specialist. Here is the dress data: ${JSON.stringify(dressData)}. Read the data carefully and give accurate responses. Answer questions related to dresses only.and give the answer by next next line.`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userInput }
        ],
        model: "llama-3.1-70b-versatile",
      });

      const botResponse = chatCompletion.choices[0]?.message?.content || "";

      setChatHistory([...chatHistory, { role: "user", content: userInput }, { role: "bot", content: botResponse }]);
      setResponse(botResponse);
      setUserInput("");
    } catch (err) {
      console.error("Error fetching prompt:", err);
      setError("Error fetching response from Groq API");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to display messages from the chatbot
  const displayChatbotMessage = (message) => {
    setChatHistory([...chatHistory, { role: "bot", content: message }]);
  };

  // Functions to handle order quantity
  const handleIncrement = (id) => {
    setOrderCounts({
      ...orderCounts,
      [id]: (orderCounts[id] || 0) + 1,
    });
  };

  const handleDecrement = (id) => {
    if (orderCounts[id] > 0) {
      setOrderCounts({
        ...orderCounts,
        [id]: orderCounts[id] - 1,
      });
    }
  };

  // Function to handle placing an order
  const handleOrder = async (id) => {
    const userId = getAuth().currentUser?.uid; // Get current user ID
    if (!userId) {
      alert('You need to be logged in to place an order.');
      return;
    }

    // Find the selected dress based on its ID
    const selectedDress = dressData.find(dress => dress._id === id);

    if (!selectedDress) {
      alert('Dress not found.');
      return;
    }

    try {
      // Fetch the user details
      const userDocRef = doc(db, 'users', userId); // Reference to the user's document
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userDetails = userDoc.data(); // Get user details
        const orderQty = orderCounts[id] || 1;
        const selectedSize = selectedSizes[id] || 'M';

        // Check if selectedDress has seller information
        console.log("Selected Dress:", selectedDress);
        const seller = selectedDress.seller; // Assuming the seller info is in the dress data
        console.log("Seller:", seller);

        let sellerCollection;

        // Check seller and assign the appropriate collection
        if (seller === 'abc') {
          sellerCollection = 'abc seller';
        } else if (seller === 'xyz') {
          sellerCollection = 'xyz seller';
        } else if (seller === 'fabrics') {
          sellerCollection = 'fabrics seller';
        } else if (seller === 'ds') {
          sellerCollection = 'ds seller';
        } else {
          console.log('Unknown seller:', seller);
          alert('Unknown seller. Cannot place order.');
          return;
        }

        // Prepare order data
        const orderData = {
          dressId: id,
          quantity: orderQty,
          size: selectedSize,
          userId: userId,
          name: userDetails.name,
          phone: userDetails.phone,
          address: userDetails.address,
          color: selectedDress.color,
          pattern: selectedDress.pattern,
          imagePath: selectedDress.imagePath,
          price: selectedDress.price,
          timestamp: new Date(),
        };

        // Add order to main 'orders' collection
        console.log("Adding to main 'orders' collection...");
        await addDoc(collection(db, 'orders'), orderData);

        // Add order to seller-specific collection
        console.log(`Adding to seller-specific collection: ${sellerCollection}`);
        await addDoc(collection(db, sellerCollection), orderData);

        console.log('Order successfully added!');
        navigate('/credit'); // Redirect to credit page
      } else {
        alert('User details not found.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again later.');
    }
  };

  // Function to handle size selection
  const handleSizeChange = (dressId, size) => {
    setSelectedSizes({
      ...selectedSizes,
      [dressId]: size,
    });
  };

  // Function to handle adding a dress to the wishlist
  const handleAddToWishlist = async (dress) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const { uid, email } = user;

      const wishlistItem = {
        uid,
        email,
        dressId: dress._id,
        color: dress.color,
        pattern: dress.pattern,
        size: dress.size,
        price: dress.price,
        imagePath: dress.imagePath,
        timestamp: new Date(),
      };

      try {
        await addDoc(collection(db, 'wishlists'), wishlistItem);
        setWishlistItems([...wishlistItems, dress._id]);
        setAddedToWishlist(prev => new Set(prev).add(dress._id));
        alert(`Added ${dress.color} ${dress.pattern} to your wishlist.`);
      } catch (error) {
        console.error('Error adding to wishlist:', error);
      }
    } else {
      alert('You need to log in to add items to your wishlist.');
    }
  };

  // Function to render the list of filtered dresses
  const renderFilteredDresses = () => {
    if (filteredDresses.length === 0) {
      return <p className="no-results">No matching dresses found.</p>;
    }

    return (
      <div className="dress-list">
        {filteredDresses.map((dress, index) => (
          <div className="dress-card" key={index}>
            <img
              className="dress-image"
              src={`http://localhost:5000${dress.imagePath}`}
              alt={`${dress.color} ${dress.pattern}`}
            />
            <div className="dress-details">
              <div className="dress-title">{`${dress.color} ${dress.pattern}`}</div>
              <div className="dress-size">
                Size:
                <select
                  value={selectedSizes[dress._id] || 'M'}
                  onChange={(e) => handleSizeChange(dress._id, e.target.value)}
                >
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
              </div>
              <div className="dress-price">Price: {dress.price}</div>

              <div className="order-controls">
                <button onClick={() => handleDecrement(dress._id)}>-</button>
                <span>{orderCounts[dress._id] || 0}</span>
                <button onClick={() => handleIncrement(dress._id)}>+</button>
              </div>

              <button
                className="order-button"
                onClick={() => handleOrder(dress._id)}
              >
                Order
              </button>
              <button
                className={`wishlist-button ${addedToWishlist.has(dress._id) ? 'added' : ''}`}
                onClick={() => handleAddToWishlist(dress)}
              >
                {addedToWishlist.has(dress._id) ? 'Added to Wishlist' : 'Add to Wishlist'}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="chatbot-container">
      <h2 className="wishlist-title">Dress Specialist</h2>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search for dresses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message here..."
        />
        <button onClick={fetchPrompt} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Send'}
         
        </button>
        
      </div>
      <div className="chat-history">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>

      {renderFilteredDresses()}
    </div>
  );
};

export default Chatbot;
