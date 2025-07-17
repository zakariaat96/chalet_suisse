import React, { useState, useEffect } from 'react';

const ChaletMapEmbed = ({ chalet }) => {
  const [mapSrc, setMapSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chalet) {
      setIsLoading(false);
      return;
    }

    // Build the map URL using the chalet data
    const buildMapUrl = () => {
      const { latitude, longitude, address, city, canton, title } = chalet;
      
      if (latitude && longitude) {
        // Use coordinates directly - most accurate method
     //   console.log(`Using coordinates for ${title}: ${latitude}, ${longitude}`);
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        // Google Maps embed URL with coordinates
        return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s${encodeURIComponent(title || 'Chalet')}!5e0!3m2!1sen!2sch!4v${Date.now()}!5m2!1sen!2sch`;
      } else if (address && city) {
        // Use full address if available
     //   console.log(`Using full address for ${title}: ${address}, ${city}`);
        const fullAddress = `${address}, ${city}${canton ? ', ' + canton : ''}, Switzerland`;
        const searchQuery = encodeURIComponent(fullAddress);
        return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d10000!2d8.2275!3d46.8182!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s${searchQuery}!5e0!3m2!1sen!2sch!4v${Date.now()}!5m2!1sen!2sch`;
      } else if (city) {
        // Use city search
     //   console.log(`Using city for ${title}: ${city}`);
        const cityQuery = `${city}${canton ? ', ' + canton : ''}, Switzerland`;
        const searchQuery = encodeURIComponent(cityQuery);
        return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d50000!2d8.2275!3d46.8182!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s${searchQuery}!5e0!3m2!1sen!2sch!4v${Date.now()}!5m2!1sen!2sch`;
      } else {
        // Fallback to Switzerland
     //   console.log(`Using fallback for ${title}: Switzerland`);
        return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d200000!2d8.2275!3d46.8182!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sSwitzerland!5e0!3m2!1sen!2sch!4v${Date.now()}!5m2!1sen!2sch`;
      }
    };

    // Debug information
 //   console.log('=== MAP DEBUG ===');
 //   console.log('Chalet:', chalet);
 //   console.log('Title:', chalet.title);
 //   console.log('Latitude:', chalet.latitude, 'Type:', typeof chalet.latitude);
 //   console.log('Longitude:', chalet.longitude, 'Type:', typeof chalet.longitude);
 //   console.log('Address:', chalet.address);
 //   console.log('City:', chalet.city);
 //   console.log('Canton:', chalet.canton);
 //   console.log('Postal Code:', chalet.postal_code);

    const url = buildMapUrl();
 //   console.log('Generated URL:', url);
    setMapSrc(url);
    setIsLoading(false);
  }, [chalet]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    console.error('Failed to load Google Maps');
  };

  if (!chalet) {
    return (
      <div className="chalet-map-container">
        <p>Map not available</p>
      </div>
    );
  }

  return (
    <div className="chalet-map-container">

      {/* Loading indicator */}
      {isLoading && (
        <div className="map-loading" style={{ 
          textAlign: 'center', 
          padding: '40px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '12px' 
        }}>
          <div className="loading-spinner" style={{ 
            width: '20px', 
            height: '20px', 
            border: '2px solid #ddd', 
            borderTop: '2px solid #333', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px' 
          }}></div>
          <p>Loading map for {chalet.title}...</p>
        </div>
      )}
      
      {/* Map iframe */}
      <iframe
        src={mapSrc}
        width="100%"
        height="300"
        style={{
          border: 0,
          borderRadius: '12px',
          display: isLoading ? 'none' : 'block'
        }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Map showing location of ${chalet.title || 'chalet'}`}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />

      {/* Add CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ChaletMapEmbed;