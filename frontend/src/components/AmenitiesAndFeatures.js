import React, { useState } from 'react';
import { 
  FiChevronDown, FiWifi, FiTv, FiMusic, FiMonitor, FiThermometer, FiWind, FiDroplet, 
  FiSun, FiTool, FiSettings, FiHome, FiZap, FiCoffee, FiTruck, FiNavigation, FiHeart,
  FiUsers, FiShield, FiStar, FiEye, FiBookOpen, FiPlay, FiGift, FiTrello, FiCloud,
  FiUmbrella, FiTriangle, FiActivity, FiFeather, FiCloudSnow, FiUser, FiCircle,
  FiVolume2, FiMoon
} from 'react-icons/fi';
import '../styles/AmenitiesAndFeatures.css';


function AmenitiesAndFeatures({ 
  selectedAmenities = [], 
  selectedFeatures = [], 
  onAmenityToggle, 
  onFeatureToggle 
}) {
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);

  // Amenities & Services with React Icons
  const amenitiesAndServices = {
    'Internet & Technology': [
      { id: 'wifi', label: 'Wi-Fi Internet', icon: FiWifi },
      { id: 'cable_tv', label: 'Cable/Satellite TV', icon: FiTv },
      { id: 'sound_system', label: 'Sound System', icon: FiMusic },
      { id: 'workspace', label: 'Workspace/Office Area', icon: FiMonitor }
    ],
    'Utilities & Maintenance': [
      { id: 'heating', label: 'Central Heating', icon: FiThermometer },
      { id: 'air_conditioning', label: 'Air Conditioning', icon: FiWind },
      { id: 'laundry', label: 'Washing Machine', icon: FiDroplet },
      { id: 'dryer', label: 'Dryer', icon: FiSun },
      { id: 'iron', label: 'Iron & Ironing Board', icon: FiTool },
      { id: 'cleaning_service', label: 'Cleaning Service Available', icon: FiSettings }
    ],
    'Kitchen Services': [
      { id: 'kitchen_equipped', label: 'Fully Equipped Kitchen', icon: FiHome },
      { id: 'dishwasher', label: 'Dishwasher', icon: FiDroplet },
      { id: 'oven', label: 'Oven', icon: FiZap },
      { id: 'microwave', label: 'Microwave', icon: FiZap },
      { id: 'coffee_machine', label: 'Coffee Machine', icon: FiCoffee }
    ],
    'Transportation & Access': [
      { id: 'parking', label: 'Parking Space', icon: FiTruck },
      { id: 'garage', label: 'Private Garage', icon: FiHome },
      { id: 'elevator', label: 'Elevator Access', icon: FiNavigation },
      { id: 'wheelchair_accessible', label: 'Wheelchair Accessible', icon: FiHeart }
    ],
    'Professional Services': [
      { id: 'concierge', label: 'Concierge Service', icon: FiUsers },
      { id: 'security', label: 'Security System', icon: FiShield },
      { id: 'maintenance', label: 'Maintenance Service', icon: FiTool },
      { id: 'housekeeping', label: 'Housekeeping Service', icon: FiStar }
    ]
  };

  // Chalet Features with React Icons
  const chaletFeatures = {
    'Interior Features': [
      { id: 'fireplace', label: 'Fireplace', icon: FiZap },
      { id: 'balcony', label: 'Balcony/Terrace', icon: FiEye },
      { id: 'dining_area', label: 'Formal Dining Area', icon: FiCoffee },
      { id: 'library', label: 'Library/Reading Room', icon: FiBookOpen },
      { id: 'game_room', label: 'Game Room/Entertainment Room', icon: FiPlay },
      { id: 'wine_cellar', label: 'Wine Cellar', icon: FiGift },
      { id: 'walk_in_closet', label: 'Walk-in Closet', icon: FiHome },
      { id: 'hardwood_floors', label: 'Hardwood Floors', icon: FiTrello }
    ],
    'Outdoor Features': [
      { id: 'garden', label: 'Private Garden', icon: FiCloud },
      { id: 'patio', label: 'Patio/Deck', icon: FiSun },
      { id: 'bbq_area', label: 'BBQ/Grill Area', icon: FiZap },
      { id: 'outdoor_seating', label: 'Outdoor Seating Area', icon: FiUmbrella },
      { id: 'outdoor_kitchen', label: 'Outdoor Kitchen', icon: FiCoffee },
      { id: 'gazebo', label: 'Gazebo/Pergola', icon: FiUmbrella },
      { id: 'landscaping', label: 'Professional Landscaping', icon: FiCloud }
    ],
    'Luxury & Wellness': [
      { id: 'hot_tub', label: 'Hot Tub/Jacuzzi', icon: FiDroplet },
      { id: 'sauna', label: 'Sauna', icon: FiThermometer },
      { id: 'steam_room', label: 'Steam Room', icon: FiWind },
      { id: 'pool', label: 'Swimming Pool', icon: FiDroplet },
      { id: 'gym', label: 'Private Gym/Fitness Room', icon: FiActivity },
      { id: 'spa_room', label: 'Spa/Massage Room', icon: FiHeart },
      { id: 'meditation_room', label: 'Meditation/Yoga Room', icon: FiFeather }
    ],
    'Alpine & Winter Features': [
      { id: 'ski_storage', label: 'Ski Storage Room', icon: FiHome },
      { id: 'boot_warmer', label: 'Boot Warmer/Drying Room', icon: FiThermometer },
      { id: 'mountain_view', label: 'Mountain Views', icon: FiTriangle },
      { id: 'valley_view', label: 'Valley Views', icon: FiEye },
      { id: 'lake_view', label: 'Lake Views', icon: FiDroplet },
      { id: 'ski_in_out', label: 'Ski-in/Ski-out Access', icon: FiCloudSnow },
      { id: 'slope_access', label: 'Direct Slope Access', icon: FiTriangle }
    ],
    'Family & Accessibility': [
      { id: 'baby_crib', label: 'Baby Crib Available', icon: FiUser },
      { id: 'high_chair', label: 'High Chair', icon: FiHome },
      { id: 'toys_games', label: 'Children Toys & Games', icon: FiPlay },
      { id: 'pet_friendly', label: 'Pet Friendly', icon: FiCircle },
      { id: 'smoking_allowed', label: 'Smoking Allowed', icon: FiWind },
      { id: 'quiet_location', label: 'Quiet/Secluded Location', icon: FiMoon }
    ]
  };

  const handleAmenityToggle = (amenityId) => {
    if (onAmenityToggle) {
      onAmenityToggle(amenityId);
    }
  };

  const handleFeatureToggle = (featureId) => {
    if (onFeatureToggle) {
      onFeatureToggle(featureId);
    }
  };

  return (
    <div className="amenities-features-container">
      {/* Amenities & Services Section - Collapsible with Clickable Grid Items */}
      <div className="form-section">
        <div 
          className="section-title collapsible-title" 
          onClick={() => setAmenitiesExpanded(!amenitiesExpanded)}
        >
          <FiWifi /> Amenities & Services
          <span className={`collapse-icon ${amenitiesExpanded ? 'expanded' : ''}`}>
            <FiChevronDown />
          </span>
        </div>
        
        {amenitiesExpanded && (
          <div className="collapsible-content">
            <p className="section-description">
              Select the utilities, services and basic amenities available at this property
            </p>
            <div className="amenities-container">
              {Object.entries(amenitiesAndServices).map(([category, amenities]) => (
                <div key={category} className="amenities-category">
                  <h5 className="category-title">{category}</h5>
                  <div className="amenities-grid">
                    {amenities.map((amenity) => {
                      const IconComponent = amenity.icon;
                      const isSelected = selectedAmenities.includes(amenity.id);
                      
                      return (
                        <div
                          key={amenity.id}
                          className={`amenity-grid-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleAmenityToggle(amenity.id)}
                        >
                          <div className="amenity-icon">
                            <IconComponent />
                          </div>
                          <span className="amenity-text">
                            {amenity.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chalet Features Section - Collapsible with Clickable Grid Items */}
      <div className="form-section">
        <div 
          className="section-title collapsible-title" 
          onClick={() => setFeaturesExpanded(!featuresExpanded)}
        >
          <FiHome /> Chalet Features
          <span className={`collapse-icon ${featuresExpanded ? 'expanded' : ''}`}>
            <FiChevronDown />
          </span>
        </div>
        
        {featuresExpanded && (
          <div className="collapsible-content">
            <p className="section-description">
              Select the special features, characteristics and luxury amenities of this chalet
            </p>
            <div className="amenities-container">
              {Object.entries(chaletFeatures).map(([category, features]) => (
                <div key={category} className="amenities-category">
                  <h5 className="category-title">{category}</h5>
                  <div className="amenities-grid">
                    {features.map((feature) => {
                      const IconComponent = feature.icon;
                      const isSelected = selectedFeatures.includes(feature.id);
                      
                      return (
                        <div
                          key={feature.id}
                          className={`amenity-grid-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleFeatureToggle(feature.id)}
                        >
                          <div className="amenity-icon">
                            <IconComponent />
                          </div>
                          <span className="amenity-text">
                            {feature.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export default AmenitiesAndFeatures;