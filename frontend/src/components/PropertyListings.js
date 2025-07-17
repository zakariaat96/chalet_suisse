import React, { useState, useEffect } from 'react';
import '../styles/PropertyListings.css';
import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';
import Property from './Property';

const PropertyListings = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/property_manage.php?view=active`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Debug: Log the raw data to see what we're getting
       // console.log('Raw API data:', data);
        
        if (Array.isArray(data)) {
          // Optimize: Only store essential data with proper field mapping
          const optimizedData = data.map(property => {
            // Debug: Log each property's likes data
         //   console.log(`Property ${property.id} likes:`, {
            //   likes_count: property.likes_count,
            //   total_likes: property.total_likes,
            //   favorites_count: property.favorites_count
            // });
            
            return {
              id: property.id,
              title: property.title,
              price: property.price,
              main_image: property.main_image,
              city: property.city,
              bedrooms: property.bedrooms || property.bedroom_count || property.bed_count || property.beds,
              bathrooms: property.bathrooms || property.bathroom_count || property.bath_count || property.baths,
              status: property.status,
              description: property.description,
              // Use the EXACT same logic as PropertyManagement
              likes_count: parseInt(property.likes_count || 0)
            };
          });
          
          // Debug: Log the processed data
        //  console.log('Processed data with likes:', optimizedData.map(p => ({
          //   id: p.id,
          //   title: p.title,
          //   likes_count: p.likes_count
          // })));
          
          // Sort by likes count (descending) - EXACT same logic as PropertyManagement
          const mostLikedProperties = optimizedData
            .sort((a, b) => parseInt(b.likes_count || 0) - parseInt(a.likes_count || 0))
            .slice(0, 4);
          
          // Debug: Log the final sorted results
         // console.log('Top 4 most liked:', mostLikedProperties.map(p => ({
          //   id: p.id,
          //   title: p.title,
          //   likes_count: p.likes_count
          // })));
          
          setProperties(mostLikedProperties);
        } else {
          throw new Error('Invalid data format received from API');
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError(`Error loading properties: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) return <div className="loading">Loading properties...</div>;
  if (error) return <div className="error">{error}</div>;
  if (properties.length === 0) return <div className="no-results">No properties found.</div>;

  return (
    <section className="property-listings">
      <div className="listings-header">
        <h2 className="listings-title">Most Loved Swiss Chalets</h2>
        <p className="listings-subtitle">
          Discover the chalets that have captured the hearts of our visitors. These are the most favorited and highly appreciated properties across Switzerland.
        </p>
      </div>

      <div className="properties-container">
        <div className="properties-grid">
          {properties.map(property => (
            <Property key={property.id} property={property} variant="default" />
          ))}
        </div>
      </div>

      <div className="view-all-container">
        <Link to="/chalets" className="view-all-btn">
          <FiHome /> View All Chalets
        </Link>
      </div>
    </section>
  );
};

export default PropertyListings;