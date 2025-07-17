import React, { useState, useEffect, useRef } from 'react';
import { 
  FiX, FiSave, FiUpload, FiTrash, FiImage, FiMapPin, FiMap, FiRefreshCw, FiHome, 
  FiSearch, FiMonitor, FiSettings, FiTool, FiThermometer, FiWind, FiCoffee, FiShield, 
  FiUsers, FiTv, FiMusic, FiZap, FiDroplet, FiSun, FiMoon, FiLock, FiPhone, FiHeart, 
  FiStar, FiGift, FiUmbrella, FiCamera, FiBookOpen, FiPlay, FiGlobe, FiNavigation, 
  FiEye, FiSmile, FiFeather, FiTrello, FiCloud, FiCloudSnow, FiTriangle, FiActivity, 
  FiUser, FiCircle, FiVolume2
} from 'react-icons/fi';
import axios from 'axios';
import AmenitiesAndFeatures from './AmenitiesAndFeatures';
import '../styles/PropertyModal.css';

function PropertyModal({ isOpen, onClose, property, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    beds: '1',
    baths: '1',
    sqft: '100',
    year_built: '',
    city: '',
    canton: '',
    address: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    status: 'Available',
    property_type: 'Chalet',
    main_image: '',
    gallery_images: [],
    amenities: [],
    features: [],
    days_on_market: '0',
    user_id: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Image upload states
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  
  // Gallery images states
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [galleryDragActive, setGalleryDragActive] = useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState(0);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const galleryInputRef = useRef(null);

  // Map picker states
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Location search states
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Fetch users for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/get_users.php`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.data.success) {
          setUsers(response.data.users || []);
        } else {
          console.error('Failed to fetch users:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Initialize OpenStreetMap when map picker is opened
  useEffect(() => {
    if (showMapPicker && !mapInitialized) {
      const timer = setTimeout(() => {
        initializeMap();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showMapPicker, mapInitialized]);

  // Location search with debouncing
  useEffect(() => {
    if (locationSearchQuery.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        searchLocation(locationSearchQuery);
      }, 500);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [locationSearchQuery]);

  const searchLocation = async (query) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&countrycodes=ch&q=${encodeURIComponent(query)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        const formattedResults = data.map(result => ({
          id: result.place_id,
          displayName: result.display_name,
          name: result.name,
          address: result.address,
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          type: result.type,
          importance: result.importance
        })).sort((a, b) => b.importance - a.importance);
        
        setSearchResults(formattedResults);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (location) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([location.lat, location.lon], 15);
      
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }
      
      const marker = window.L.marker([location.lat, location.lon], {
        draggable: true
      }).addTo(mapInstanceRef.current);
      
      markerRef.current = marker;
      setSelectedLocation({ lat: location.lat, lng: location.lon });
      
      marker.on('dragend', (event) => {
        const newLat = event.target.getLatLng().lat;
        const newLng = event.target.getLatLng().lng;
        setSelectedLocation({ lat: newLat, lng: newLng });
        getAddressFromCoordinates(newLat, newLng);
      });
      
      getAddressFromCoordinates(location.lat, location.lon);
    }
    
    setLocationSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const initializeMap = () => {
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        createMap();
      };
      document.head.appendChild(script);
    } else {
      createMap();
    }
  };

  const createMap = () => {
    if (mapRef.current) {
      mapRef.current.innerHTML = '';
    }
    
    const defaultCenter = [46.8182, 8.2275];
    
    let initialCenter = defaultCenter;
    if (formData.latitude && formData.longitude) {
      initialCenter = [parseFloat(formData.latitude), parseFloat(formData.longitude)];
    }

    try {
      const map = window.L.map(mapRef.current, {
        preferCanvas: true,
        attributionControl: true,
        zoomControl: true
      }).setView(initialCenter, 8);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;

      setTimeout(() => {
        if (map) {
          map.invalidateSize();
        }
      }, 200);

      map.on('click', (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }

        const marker = window.L.marker([lat, lng], {
          draggable: true
        }).addTo(map);

        markerRef.current = marker;
        setSelectedLocation({ lat, lng });

        getAddressFromCoordinates(lat, lng);

        marker.on('dragend', (event) => {
          const newLat = event.target.getLatLng().lat;
          const newLng = event.target.getLatLng().lng;
          setSelectedLocation({ lat: newLat, lng: newLng });
          getAddressFromCoordinates(newLat, newLng);
        });
      });

      if (formData.latitude && formData.longitude) {
        const existingMarker = window.L.marker(initialCenter, {
          draggable: true
        }).addTo(map);

        markerRef.current = existingMarker;
        setSelectedLocation({ lat: initialCenter[0], lng: initialCenter[1] });

        existingMarker.on('dragend', (event) => {
          const newLat = event.target.getLatLng().lat;
          const newLng = event.target.getLatLng().lng;
          setSelectedLocation({ lat: newLat, lng: newLng });
          getAddressFromCoordinates(newLat, newLng);
        });
      }

      setMapInitialized(true);
    } catch (error) {
      console.error('Error creating map:', error);
      setMapInitialized(false);
    }
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    setIsLoadingAddress(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.address) {
          const address = data.address;
          
          const streetNumber = address.house_number || '';
          const street = address.road || '';
          const city = address.city || address.town || address.village || '';
          const state = address.state || '';
          const postcode = address.postcode || '';
          
          const fullAddress = `${streetNumber} ${street}`.trim();
          
          setFormData(prevData => ({
            ...prevData,
            latitude: lat.toString(),
            longitude: lng.toString(),
            address: fullAddress || data.display_name,
            city: city || '',
            canton: state || '',
            postal_code: postcode || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error getting address:', error);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleMapPickerSave = () => {
    if (selectedLocation) {
      setShowMapPicker(false);
      resetMapState();
    } else {
      alert('Please select a location on the map first.');
    }
  };

  const handleMapPickerCancel = () => {
    setShowMapPicker(false);
    setSelectedLocation(null);
    setLocationSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
    resetMapState();
  };

  const resetMapState = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (markerRef.current) {
      markerRef.current = null;
    }
    setMapInitialized(false);
  };

  useEffect(() => {
    if (property) {
      let formattedPrice = property.price;
      if (typeof formattedPrice === 'string') {
        formattedPrice = formattedPrice.replace(/[^\d.]/g, '');
      }

      let galleryImagesArray = [];
      if (property.gallery_images) {
        try {
          if (typeof property.gallery_images === 'string') {
            galleryImagesArray = JSON.parse(property.gallery_images);
          } else if (Array.isArray(property.gallery_images)) {
            galleryImagesArray = property.gallery_images;
          }
        } catch (error) {
          console.error('Error parsing gallery_images:', error);
          galleryImagesArray = [];
        }
      }

      let amenitiesArray = [];
      let featuresArray = [];
      
      if (property.amenities) {
        try {
          if (typeof property.amenities === 'string') {
            amenitiesArray = JSON.parse(property.amenities);
          } else if (Array.isArray(property.amenities)) {
            amenitiesArray = property.amenities;
          }
        } catch (error) {
          console.error('Error parsing amenities:', error);
          amenitiesArray = [];
        }
      }

      const featureData = property.features || property.chalet_features;
      if (featureData) {
        try {
          if (typeof featureData === 'string') {
            featuresArray = JSON.parse(featureData);
          } else if (Array.isArray(featureData)) {
            featuresArray = featureData;
          }
        } catch (error) {
          console.error('Error parsing features:', error);
          featuresArray = [];
        }
      }

      setFormData({
        title: property.title || '',
        description: property.description || '',
        price: formattedPrice || '',
        beds: property.beds?.toString() || '1',
        baths: property.baths?.toString() || '1',
        sqft: property.sqft?.toString() || '100',
        year_built: property.year_built?.toString() || '',
        city: property.city || '',
        canton: property.canton || '',
        address: property.address || '',
        postal_code: property.postal_code || '',
        latitude: property.latitude?.toString() || '',
        longitude: property.longitude?.toString() || '',
        status: property.status || 'Available',
        property_type: property.property_type || 'Chalet',
        main_image: property.main_image || '',
        gallery_images: galleryImagesArray,
        amenities: amenitiesArray,
        features: featuresArray,
        days_on_market: property.days_on_market?.toString() || '0',
        user_id: property.user_id?.toString() || ''
      });
      
      if (property.main_image) {
        setPreviewUrl(property.main_image.startsWith('http') 
          ? property.main_image 
          : `${process.env.REACT_APP_BASE_URL}/${property.main_image}`);
      } else {
        setPreviewUrl('');
      }
      
      if (galleryImagesArray.length > 0) {
        const previews = galleryImagesArray.map(img => 
          img.startsWith('http') ? img : `${process.env.REACT_APP_BASE_URL}/${img}`
        );
        setGalleryPreviews(previews);
      } else {
        setGalleryPreviews([]);
      }
    } else {
      setFormData({
        title: '',
        description: '',
        price: '',
        beds: '1',
        baths: '1',
        sqft: '100',
        year_built: '',
        city: '',
        canton: '',
        address: '',
        postal_code: '',
        latitude: '',
        longitude: '',
        status: 'Available',
        property_type: 'Chalet',
        main_image: '',
        gallery_images: [],
        amenities: [],
        features: [],
        days_on_market: '0',
        user_id: users.length > 0 ? users[0].id.toString() : ''
      });
      setPreviewUrl('');
      setImageFile(null);
      setGalleryPreviews([]);
      setGalleryFiles([]);
    }
    setFormErrors({});
    setUploadProgress(0);
    setIsUploading(false);
    setGalleryUploadProgress(0);
    setIsGalleryUploading(false);
    setShowMapPicker(false);
    setMapInitialized(false);
    setLocationSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
    resetMapState();
  }, [property, isOpen, users]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle amenities selection
  const handleAmenityToggle = (amenityId) => {
    const updatedAmenities = [...formData.amenities];
    const index = updatedAmenities.indexOf(amenityId);
    
    if (index > -1) {
      updatedAmenities.splice(index, 1);
    } else {
      updatedAmenities.push(amenityId);
    }
    
    setFormData({
      ...formData,
      amenities: updatedAmenities
    });
  };

  // Handle features selection
  const handleFeatureToggle = (featureId) => {
    const updatedFeatures = [...formData.features];
    const index = updatedFeatures.indexOf(featureId);
    
    if (index > -1) {
      updatedFeatures.splice(index, 1);
    } else {
      updatedFeatures.push(featureId);
    }
    
    setFormData({
      ...formData,
      features: updatedFeatures
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelected(file);
  };

  const handleGalleryFileChange = (e) => {
    const files = Array.from(e.target.files);
    handleGalleryFilesSelected(files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleGalleryDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setGalleryDragActive(true);
    } else if (e.type === 'dragleave') {
      setGalleryDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleGalleryDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setGalleryDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleGalleryFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelected = (file) => {
    if (!file) return;
    
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    
    if (!validImageTypes.includes(file.type)) {
      setFormErrors({
        ...formErrors,
        image: 'Please select a valid image file (JPEG, PNG, GIF, WEBP)'
      });
      return;
    }
    
    if (file.size > maxSize) {
      setFormErrors({
        ...formErrors,
        image: 'Image size should not exceed 5MB'
      });
      return;
    }
    
    const newErrors = {...formErrors};
    delete newErrors.image;
    setFormErrors(newErrors);
    
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleGalleryFilesSelected = (files) => {
    if (!files || files.length === 0) return;
    
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      if (!validImageTypes.includes(file.type)) {
        invalidFiles.push(`${file.name} (invalid format)`);
      } else if (file.size > maxSize) {
        invalidFiles.push(`${file.name} (exceeds 5MB)`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (invalidFiles.length > 0) {
      setFormErrors({
        ...formErrors,
        galleryImages: `Some files were not added: ${invalidFiles.join(', ')}`
      });
    } else {
      const newErrors = {...formErrors};
      delete newErrors.galleryImages;
      setFormErrors(newErrors);
    }
    
    const newFiles = [...galleryFiles, ...validFiles];
    setGalleryFiles(newFiles);
    
    const newPreviews = [
      ...galleryPreviews,
      ...validFiles.map(file => URL.createObjectURL(file))
    ];
    setGalleryPreviews(newPreviews);
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const onGalleryButtonClick = () => {
    galleryInputRef.current.click();
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const formDataUpload = new FormData();
    formDataUpload.append('image', imageFile);
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/upload_image.php`,
        formDataUpload,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
          timeout: 30000
        }
      );
      
      setIsUploading(false);
      
      if (response.data && response.data.success) {
        return response.data.image_path;
      } else {
        setFormErrors({
          ...formErrors,
          image: response.data?.message || 'Failed to upload image'
        });
        return null;
      }
    } catch (error) {
      setIsUploading(false);
      
      let errorMessage = 'Error uploading image';
      
      if (error.response) {
        errorMessage = `Server error: ${error.response.data?.message || error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'No response received from server. Is the server running?';
      } else {
        errorMessage = error.message || 'Unknown error';
      }
      
      setFormErrors({
        ...formErrors,
        image: errorMessage
      });
      
      return null;
    }
  };

  const uploadGalleryImages = async () => {
    if (!galleryFiles || galleryFiles.length === 0) {
      return formData.gallery_images;
    }
    
    setIsGalleryUploading(true);
    setGalleryUploadProgress(0);
    
    const uploadPromises = [];
    const uploadResults = [];
    
    if (formData.gallery_images && formData.gallery_images.length > 0) {
      uploadResults.push(...formData.gallery_images);
    }
    
    for (let i = 0; i < galleryFiles.length; i++) {
      const file = galleryFiles[i];
      const formPayload = new FormData();
      formPayload.append('image', file);
      
      const promise = axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/upload_image.php`,
        formPayload,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      uploadPromises.push(promise);
    }
    
    try {
      const results = await Promise.allSettled(uploadPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data && result.value.data.success) {
          uploadResults.push(result.value.data.image_path);
        } else {
          console.error(`Failed to upload gallery image ${index}:`, 
            result.status === 'rejected' ? result.reason : result.value?.data);
        }
      });
      
      setIsGalleryUploading(false);
      
      if (uploadResults.length > 0) {
        return uploadResults;
      } else {
        setFormErrors({
          ...formErrors,
          galleryImages: 'Failed to upload gallery images'
        });
        return [];
      }
    } catch (error) {
      setIsGalleryUploading(false);
      
      setFormErrors({
        ...formErrors,
        galleryImages: 'Error uploading gallery images: ' + (error.message || 'Unknown error')
      });
      
      return [];
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.price.trim()) errors.price = 'Price is required';
    if (isNaN(parseFloat(formData.price))) errors.price = 'Price must be a valid number';
    if (!formData.beds.trim() || isNaN(parseInt(formData.beds))) errors.beds = 'Valid number of beds is required';
    if (!formData.baths.trim() || isNaN(parseInt(formData.baths))) errors.baths = 'Valid number of baths is required';
    if (!formData.sqft.trim() || isNaN(parseInt(formData.sqft))) errors.sqft = 'Valid area in sqft is required';
    if (!formData.user_id) errors.user_id = 'Owner/user selection is required';
    if (!formData.postal_code) errors.postal_code = 'Postal code is required';
    if (formData.year_built && (isNaN(parseInt(formData.year_built)) || parseInt(formData.year_built) < 1800 || parseInt(formData.year_built) > new Date().getFullYear())) {
      errors.year_built = 'Please enter a valid year between 1800 and current year';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      let imagePath = formData.main_image;
      
      if (imageFile) {
        imagePath = await uploadImage();
        if (!imagePath) return;
      }
      
      const galleryPaths = await uploadGalleryImages();
      
      const processedData = {
        ...formData,
        price: parseFloat(formData.price),
        beds: parseInt(formData.beds),
        baths: parseInt(formData.baths),
        sqft: parseInt(formData.sqft),
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        days_on_market: parseInt(formData.days_on_market),
        user_id: parseInt(formData.user_id),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        main_image: imagePath,
        gallery_images: galleryPaths,
        amenities: JSON.stringify(formData.amenities),
        features: JSON.stringify(formData.features)
      };
      
      if (property) {
        processedData.id = property.id;
      }
      
    //  console.log('Submitting features:', {
      //   rawFeatures: formData.features,
      //   stringified: JSON.stringify(formData.features),
      //   count: formData.features.length
      // });
      
      onSave(processedData);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl('');
    setFormData({
      ...formData,
      main_image: ''
    });
  };

  const removeGalleryImage = (index) => {
    const newPreviews = [...galleryPreviews];
    newPreviews.splice(index, 1);
    setGalleryPreviews(newPreviews);
    
    if (index < galleryFiles.length) {
      const newFiles = [...galleryFiles];
      newFiles.splice(index, 1);
      setGalleryFiles(newFiles);
    } else {
      const newGalleryImages = [...formData.gallery_images];
      const originalIndex = index - galleryFiles.length;
      if (originalIndex >= 0 && originalIndex < newGalleryImages.length) {
        newGalleryImages.splice(originalIndex, 1);
        setFormData({
          ...formData,
          gallery_images: newGalleryImages
        });
      }
    }
  };

  const formatSearchResultDisplay = (result) => {
    const { address, name, type } = result;
    let displayText = name;
    
    if (address) {
      const parts = [];
      if (address.village || address.town || address.city) {
        parts.push(address.village || address.town || address.city);
      }
      if (address.state) {
        parts.push(address.state);
      }
      if (parts.length > 0) {
        displayText += ` (${parts.join(', ')})`;
      }
    }
    
    return displayText;
  };

  const getSearchResultIcon = (type) => {
    switch (type) {
      case 'city':
      case 'town':
      case 'village':
        return '🏘️';
      case 'administrative':
        return '🏛️';
      case 'tourism':
        return '🏔️';
      default:
        return '📍';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{property ? `Edit Chalet: ${property.title}` : 'Add New Chalet'}</h3>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="property-form">
          {/* Basic Property Information */}
          <div className="form-section">
            <h4 className="section-title">
              <FiHome /> Basic Chalet Information
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="title">Title*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={formErrors.title ? 'error' : ''}
                />
                {formErrors.title && <div className="error-text">{formErrors.title}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="property_type">Property Type</label>
                <select
                  id="property_type"
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                >
                  <option value="Chalet">Chalet</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="price">Price (₣)*</label>
                <input
                  type="text"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className={formErrors.price ? 'error' : ''}
                  placeholder="e.g. 1500000"
                />
                {formErrors.price && <div className="error-text">{formErrors.price}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Available">Available</option>
                  <option value="Pending">Pending</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="beds">Bedrooms*</label>
                <input
                  type="number"
                  id="beds"
                  name="beds"
                  value={formData.beds}
                  onChange={handleChange}
                  className={formErrors.beds ? 'error' : ''}
                  min="1"
                />
                {formErrors.beds && <div className="error-text">{formErrors.beds}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="baths">Bathrooms*</label>
                <input
                  type="number"
                  id="baths"
                  name="baths"
                  value={formData.baths}
                  onChange={handleChange}
                  className={formErrors.baths ? 'error' : ''}
                  min="1"
                />
                {formErrors.baths && <div className="error-text">{formErrors.baths}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="sqft">Area (sqft)*</label>
                <input
                  type="number"
                  id="sqft"
                  name="sqft"
                  value={formData.sqft}
                  onChange={handleChange}
                  className={formErrors.sqft ? 'error' : ''}
                  min="1"
                />
                {formErrors.sqft && <div className="error-text">{formErrors.sqft}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="year_built">Year Built</label>
                <input
                  type="number"
                  id="year_built"
                  name="year_built"
                  value={formData.year_built}
                  onChange={handleChange}
                  className={formErrors.year_built ? 'error' : ''}
                  placeholder="e.g. 2020"
                  min="1800"
                  max={new Date().getFullYear()}
                />
                {formErrors.year_built && <div className="error-text">{formErrors.year_built}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="days_on_market">Days on Market</label>
                <input
                  type="number"
                  id="days_on_market"
                  name="days_on_market"
                  value={formData.days_on_market}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="form-section">
            <h4 className="section-title">
              <FiMapPin /> Location Information
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="city">City*</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={formErrors.city ? 'error' : ''}
                />
                {formErrors.city && <div className="error-text">{formErrors.city}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="canton">Canton</label>
                <input
                  type="text"
                  id="canton"
                  name="canton"
                  value={formData.canton}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="postal_code">Postal Code*</label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className={formErrors.postal_code ? 'error' : ''}
                />
                {formErrors.postal_code && <div className="error-text">{formErrors.postal_code}</div>}
              </div>
            </div>
            
            <div className="location-picker-container">
              <div className="location-info">
                <div className="location-coordinates">
                  <div className="coordinate-group">
                    <label htmlFor="latitude">Latitude</label>
                    <input
                      type="text"
                      id="latitude"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="e.g. 46.8182"
                      readOnly={isLoadingAddress}
                    />
                  </div>
                  <div className="coordinate-group">
                    <label htmlFor="longitude">Longitude</label>
                    <input
                      type="text"
                      id="longitude"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      placeholder="e.g. 8.2275"
                      readOnly={isLoadingAddress}
                    />
                  </div>
                </div>
                
                <button 
                  type="button" 
                  className="map-picker-btn"
                  onClick={() => setShowMapPicker(true)}
                >
                  <FiMap /> {formData.latitude && formData.longitude ? 'Update Location' : 'Select Location on Map'}
                </button>
                
                {isLoadingAddress && (
                  <div className="loading-address">
                    <FiRefreshCw className="spin" /> Getting address...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amenities & Features Component */}
          <AmenitiesAndFeatures
            selectedAmenities={formData.amenities}
            selectedFeatures={formData.features}
            onAmenityToggle={handleAmenityToggle}
            onFeatureToggle={handleFeatureToggle}
          />
          
          {/* Image Upload Section */}
          <div className="form-section">
            <h4 className="section-title">
              <FiImage /> Chalet Images
            </h4>
            
            <div className="form-group">
              <label>Main Image</label>
              <div 
                className={`image-upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                
                {previewUrl ? (
                  <div className="image-preview">
                    <img src={previewUrl} alt="Property preview" />
                    <button type="button" className="remove-image-btn" onClick={removeImage}>
                      <FiTrash /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder" onClick={onButtonClick}>
                    <FiUpload className="upload-icon" />
                    <p>Drag & drop a main image here, or click to select</p>
                    <span className="file-formats">Supported formats: JPEG, PNG, GIF, WEBP (max 5MB)</span>
                  </div>
                )}
                
                {isUploading && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <span>{uploadProgress}% Uploaded</span>
                  </div>
                )}
                
                {formErrors.image && <div className="error-text">{formErrors.image}</div>}
              </div>
            </div>
            
            <div className="form-group">
              <label>Gallery Images</label>
              <div 
                className={`gallery-upload-area ${galleryDragActive ? 'drag-active' : ''}`}
                onDragEnter={handleGalleryDrag}
                onDragOver={handleGalleryDrag}
                onDragLeave={handleGalleryDrag}
                onDrop={handleGalleryDrop}
              >
                <input 
                  type="file" 
                  ref={galleryInputRef}
                  onChange={handleGalleryFileChange}
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                />
                
                <div className="gallery-upload-header">
                  <div className="upload-placeholder" onClick={onGalleryButtonClick}>
                    <FiImage className="upload-icon" />
                    <p>Click to add gallery images or drop them here</p>
                    <span className="file-formats">Select multiple images if needed (max 10)</span>
                  </div>
                </div>
                
                {isGalleryUploading && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${galleryUploadProgress}%` }}></div>
                    </div>
                    <span>{galleryUploadProgress}% Uploaded</span>
                  </div>
                )}
                
                {formErrors.galleryImages && 
                  <div className="error-text">{formErrors.galleryImages}</div>}
                
                {galleryPreviews.length > 0 && (
                  <div className="gallery-previews">
                    {galleryPreviews.map((preview, index) => (
                      <div key={`gallery-${index}`} className="gallery-preview-item">
                        <img src={preview} alt={`Gallery preview ${index + 1}`} />
                        <button 
                          type="button" 
                          className="remove-gallery-image-btn"
                          onClick={() => removeGalleryImage(index)}
                          title="Remove this image"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="form-section">
            <h4 className="section-title">Additional Information</h4>
            
            <div className="form-group">
              <label htmlFor="user_id">Owner/User*</label>
              <select
                id="user_id"
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                className={formErrors.user_id ? 'error' : ''}
                disabled={loadingUsers}
              >
                <option value="">-- Select Owner --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {loadingUsers && <div className="loading-text">Loading users...</div>}
              {formErrors.user_id && <div className="error-text">{formErrors.user_id}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Describe the chalet, its unique features, and what makes it special..."
              ></textarea>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={isUploading || isGalleryUploading}>
              <FiSave /> Save Chalet
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              <FiX /> Cancel
            </button>
          </div>
        </form>
      </div>


      {showMapPicker && (
  <div className="map-picker-modal-overlay">
    <div className="map-picker-modal">
      <div className="map-picker-header">
        <h3>
          <FiMapPin /> Select Chalet Location
        </h3>
        <p>Search for a location or click on the map to select the exact position</p>
      </div>
      
      <div className="map-picker-body">
        <div className="location-search-section">
          <div className="location-search-container">
            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                className="location-search-input"
                placeholder="Search for cities, towns, or addresses in Switzerland..."
                value={locationSearchQuery}
                onChange={(e) => setLocationSearchQuery(e.target.value)}
              />
              {isSearching && (
                <div className="search-loading">
                  <FiRefreshCw className="spin" />
                </div>
              )}
              {locationSearchQuery && (
                <button 
                  className="clear-search-btn"
                  onClick={() => {
                    setLocationSearchQuery('');
                    setShowSearchResults(false);
                    setSearchResults([]);
                  }}
                >
                  <FiX />
                </button>
              )}
            </div>
            
            {showSearchResults && searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    className="search-result-item"
                    onClick={() => handleLocationSelect(result)}
                  >
                    <span className="result-icon">{getSearchResultIcon(result.type)}</span>
                    <div className="result-content">
                      <div className="result-name">{formatSearchResultDisplay(result)}</div>
                      <div className="result-details">
                        {result.type} • {result.lat.toFixed(4)}, {result.lon.toFixed(4)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {showSearchResults && searchResults.length === 0 && !isSearching && locationSearchQuery.length > 2 && (
              <div className="search-no-results">
                <p>No locations found for "{locationSearchQuery}"</p>
                <p>Try searching for a city, town, or landmark in Switzerland</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="map-container">
          <div 
            ref={mapRef} 
            className="leaflet-map"
            style={{ 
              width: '100%', 
              height: '350px',
              position: 'relative',
              background: '#f8f9fa'
            }}
          />
        </div>
        
        {selectedLocation && (
          <div className="selected-location-info">
            <FiMapPin className="location-icon" />
            <div className="location-details">
              <strong>Selected Location:</strong><br />
              Latitude: {selectedLocation.lat.toFixed(6)}<br />
              Longitude: {selectedLocation.lng.toFixed(6)}
              {isLoadingAddress && <div className="loading-small">Getting address...</div>}
            </div>
          </div>
        )}
      </div>
      
      <div className="map-picker-actions">
        <button 
          type="button"
          className="map-save-btn"
          onClick={handleMapPickerSave}
          disabled={!selectedLocation}
        >
          <FiSave /> Use This Location
        </button>
        <button 
          type="button"
          className="map-cancel-btn"
          onClick={handleMapPickerCancel}
        >
          <FiX /> Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default PropertyModal;