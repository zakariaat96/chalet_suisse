<?php
// get_chalet_by_slug.php

// Load environment variables from .env file
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

header('Access-Control-Allow-Origin: ' . $_ENV['REACT_FRONTEND_URL']);
header('Content-Type: application/json');

// Include database connection
require_once '../database/db.php';

// Get slug from request
$slug = isset($_GET['slug']) ? $_GET['slug'] : '';

if (empty($slug)) {
    http_response_code(400);
    echo json_encode(['error' => 'Slug parameter is required']);
    exit;
}

try {
    // Query to find a chalet where the slug matches
    // We normalize both the stored title and the provided slug for comparison
    $query = "SELECT * FROM chalets WHERE LOWER(REPLACE(REPLACE(title, ' ', '-'), ',', '')) LIKE :slug";
    
    $stmt = $pdo->prepare($query);
    
    // Add wildcard to search for partial match
    $stmt->bindValue(':slug', '%' . strtolower($slug) . '%', PDO::PARAM_STR);
    
    $stmt->execute();
    
    $chalet = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$chalet) {
        // If no match, try to search by a more flexible pattern
        $query = "SELECT * FROM chalets WHERE 
                LOWER(title) LIKE :title_search
                ORDER BY id DESC LIMIT 1";
        
        $stmt = $pdo->prepare($query);
        
        // Replace hyphens with spaces and use more flexible search
        $search_term = '%' . str_replace('-', '%', $slug) . '%';
        $stmt->bindValue(':title_search', $search_term, PDO::PARAM_STR);
        
        $stmt->execute();
        $chalet = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$chalet) {
            http_response_code(404);
            echo json_encode(['error' => 'Chalet not found']);
            exit;
        }
    }
    
    // Get likes count for this chalet
    $likesQuery = "SELECT COUNT(*) as likes_count FROM user_favorites WHERE chalet_id = :id";
    $likesStmt = $pdo->prepare($likesQuery);
    $likesStmt->bindValue(':id', $chalet['id'], PDO::PARAM_INT);
    $likesStmt->execute();
    $likesResult = $likesStmt->fetch(PDO::FETCH_ASSOC);
    
    // Process gallery images
    $galleryImages = json_decode($chalet['gallery_images'], true) ?: [];
    if ($chalet['main_image'] && !in_array($chalet['main_image'], $galleryImages)) {
        array_unshift($galleryImages, $chalet['main_image']);
    }
    
    // Process features and amenities from JSON columns
    $features = json_decode($chalet['features'], true) ?: [];
    $amenities = json_decode($chalet['amenities'], true) ?: [];
    
    // Feature mapping (same as in get_chalet.php)
    $featureMap = [
        'fireplace' => ['icon' => 'FaFire', 'name' => 'Fireplace'],
        'balcony' => ['icon' => 'FiEye', 'name' => 'Balcony/Terrace'],
        'hot_tub' => ['icon' => 'FaHotTub', 'name' => 'Hot Tub/Jacuzzi'],
        'sauna' => ['icon' => 'FaSpa', 'name' => 'Sauna'],
        'pool' => ['icon' => 'FaSwimmingPool', 'name' => 'Swimming Pool'],
        'gym' => ['icon' => 'FaDumbbell', 'name' => 'Private Gym/Fitness Room'],
        'ski_storage' => ['icon' => 'FiPackage', 'name' => 'Ski Storage Room'],
        'mountain_view' => ['icon' => 'FiEye', 'name' => 'Mountain Views'],
        'ski_in_out' => ['icon' => 'FaSkiing', 'name' => 'Ski-in/Ski-out Access'],
        'pet_friendly' => ['icon' => 'FaPaw', 'name' => 'Pet Friendly']
    ];
    
    // Amenity mapping
    $amenityMap = [
        'wifi' => 'Wi-Fi Internet',
        'cable_tv' => 'Cable/Satellite TV',
        'heating' => 'Central Heating',
        'air_conditioning' => 'Air Conditioning',
        'kitchen_equipped' => 'Fully Equipped Kitchen',
        'parking' => 'Parking Space',
        'elevator' => 'Elevator Access'
    ];
    
    // Process features
    $processedFeatures = [];
    foreach ($features as $featureId) {
        if (isset($featureMap[$featureId])) {
            $processedFeatures[] = $featureMap[$featureId];
        }
    }
    
    // Process amenities
    $processedAmenities = [];
    foreach ($amenities as $amenityId) {
        if (isset($amenityMap[$amenityId])) {
            $processedAmenities[] = $amenityMap[$amenityId];
        }
    }
    
    // Calculate rating based on likes
    $likesCount = (int)$likesResult['likes_count'];
    $rating = $likesCount === 0 ? 0 : round(4 + ($likesCount / 10), 1);
    
    // Build response
    $response = [
        'id' => $chalet['id'],
        'title' => $chalet['title'],
        'images' => $galleryImages,
        'price' => "₣ " . number_format($chalet['price']),
        'beds' => (int)$chalet['beds'],
        'baths' => (int)$chalet['baths'],
        'sqft' => (int)$chalet['sqft'],
        'status' => $chalet['status'],
        'address' => $chalet['address'],
        'city' => $chalet['city'],
        'canton' => $chalet['canton'],
        'postal_code' => $chalet['postal_code'],
        'type' => $chalet['property_type'],
        'description' => $chalet['description'],
        'features' => $processedFeatures,
        'amenities' => $processedAmenities,
        'rating' => $rating,
        'likes_count' => $likesCount,
        'availability' => 'Year-round',
        'yearBuilt' => $chalet['year_built'],
        'latitude' => (float)$chalet['latitude'],
        'longitude' => (float)$chalet['longitude'],
        'days_on_market' => $chalet['days_on_market']
    ];
    
    echo json_encode($response);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}