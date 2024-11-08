import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './Home.css';
import { getDoc, doc, collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc } from 'firebase/firestore';

const Home = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [wishlistItems, setWishlistItems] = useState([]);
    const db = getFirestore();
    const [orderCounts, setOrderCounts] = useState({});
    const [selectedSizes, setSelectedSizes] = useState({});
    const [addedToWishlist, setAddedToWishlist] = useState(new Set());
    const [recommendedDresses, setRecommendedDresses] = useState([]);

    // Use useCallback to avoid re-creating the fetch function on every render
    const fetchUserOrderColors = useCallback(async (allDresses) => {
        const userId = getAuth().currentUser?.uid;
        if (!userId) {
            setRecommendedDresses([]);
            return;
        }

        try {
            // Fetch user's past orders
            const ordersQuery = query(collection(db, 'orders'), where('userId', '==', userId));
            const ordersSnapshot = await getDocs(ordersQuery);

            // Extract ordered colors
            const orderedColors = new Set();
            ordersSnapshot.forEach(orderDoc => {
                const orderData = orderDoc.data();
                if (orderData.color) {
                    orderedColors.add(orderData.color.toLowerCase());
                }
            });

            // Filter dresses based on ordered colors
            const filteredDresses = allDresses.filter(dress =>
                orderedColors.has(dress.color.toLowerCase())
            );

            // If no matches, show all dresses
            if (filteredDresses.length > 0) {
                setRecommendedDresses(filteredDresses);
            } else {
                setRecommendedDresses(allDresses);
            }
        } catch (error) {
            console.error('Error fetching user orders:', error);
        }
    }, [db]);

    useEffect(() => {
        const fetchDresses = async () => {
            try {
                // Fetch all dresses
                const response = await axios.get('http://localhost:5000/api/recommended-dresses');
                const allDresses = response.data;
                // Fetch user-specific recommendations based on their past orders
                await fetchUserOrderColors(allDresses);
            } catch (err) {
                setError('Failed to fetch dresses');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDresses();
    }, [fetchUserOrderColors]);  // Added fetchUserOrderColors as a dependency

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

    const handleOrder = async (id) => {
        const userId = getAuth().currentUser?.uid;
        if (!userId) {
            alert('You need to be logged in to place an order.');
            return;
        }

        const selectedDress = recommendedDresses.find(dress => dress._id === id);
        if (!selectedDress) {
            alert('Dress not found.');
            return;
        }

        try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userDetails = userDoc.data();
                const orderQty = orderCounts[id] || 1;
                const selectedSize = selectedSizes[id] || 'M';

                await addDoc(collection(db, 'orders'), {
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
                });

                alert('Order placed successfully');
            } else {
                alert('User details not found.');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Error placing order. Please try again later.');
        }
    };

    const handleSizeChange = (dressId, size) => {
        setSelectedSizes({
            ...selectedSizes,
            [dressId]: size,
        });
    };

    const handleAddToWishlist = async (dress) => {
        const user = getAuth().currentUser;

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

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="home-container">
            <h2>Recommended Dresses</h2>
            <div className="dresses-container">
                {recommendedDresses.map(dress => (
                    <div key={dress._id} className="dress-card">
                        <img src={`http://localhost:5000${dress.imagePath}`} alt={dress.Name || 'Dress'} />
                        <div className="dress-details">
                            <h3 className="dress-title">{`${dress.color} ${dress.pattern}`}</h3>
                            <p>Color: {dress.color}</p>
                            <p>Pattern: {dress.pattern}</p>
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
                            <div className="dress-price">Price: ${dress.price}</div>
                            <div className="order-controls">
                                <button onClick={() => handleDecrement(dress._id)}>-</button>
                                <span>{orderCounts[dress._id] || 0}</span>
                                <button onClick={() => handleIncrement(dress._id)}>+</button>
                            </div>
                            <button className="order-button" onClick={() => handleOrder(dress._id)}>
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
        </div>
    );
};

export default Home;
