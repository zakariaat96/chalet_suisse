<?php
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

// Set headers for cross-origin requests and JSON response
header("Access-Control-Allow-Origin: " . $_ENV['REACT_FRONTEND_URL']);
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database connection
require_once '../database/db.php';

try {
    // Get ID from query parameter
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "ID parameter is required"]);
        exit;
    }
    
    // Query to get chalet by ID with likes count
    $stmt = $pdo->prepare("
        SELECT c.*, 
               COUNT(f.id) as likes_count,
               CASE 
                   WHEN COUNT(f.id) = 0 THEN 0
                   ELSE ROUND(4 + (COUNT(f.id)::numeric / 10), 1)
               END as rating
        FROM chalets c 
        LEFT JOIN user_favorites f ON c.id = f.chalet_id 
        WHERE c.id = :id 
        GROUP BY c.id
    ");
    $stmt->execute(['id' => $id]);
    $chalet = $stmt->fetch();
    
    if (!$chalet) {
        // Return 404 if chalet not found
        http_response_code(404);
        echo json_encode(["error" => "Chalet not found"]);
        exit;
    }
    
    // Get amenities from the database
    $amenitiesList = json_decode($chalet['amenities'], true) ?: [];
    
    // Get features from the database
    $featuresList = json_decode($chalet['features'], true) ?: [];
    
    // Feature mapping with icons and labels
    $featureMap = [
        // Interior Features
        'fireplace' => ['icon' => 'FaFire', 'name' => 'Fireplace'],
        'balcony' => ['icon' => 'FiEye', 'name' => 'Balcony/Terrace'],
        'dining_area' => ['icon' => 'FiHome', 'name' => 'Formal Dining Area'],
        'library' => ['icon' => 'FiBook', 'name' => 'Library/Reading Room'],
        'game_room' => ['icon' => 'FaGamepad', 'name' => 'Game Room/Entertainment Room'],
        'wine_cellar' => ['icon' => 'FaWineGlass', 'name' => 'Wine Cellar'],
        'walk_in_closet' => ['icon' => 'FiHome', 'name' => 'Walk-in Closet'],
        'hardwood_floors' => ['icon' => 'FiHome', 'name' => 'Hardwood Floors'],
        
        // Outdoor Features
        'garden' => ['icon' => 'FaLeaf', 'name' => 'Private Garden'],
        'patio' => ['icon' => 'FiSun', 'name' => 'Patio/Deck'],
        'bbq_area' => ['icon' => 'FiHome', 'name' => 'BBQ/Grill Area'],
        'outdoor_seating' => ['icon' => 'FiHome', 'name' => 'Outdoor Seating Area'],
        'outdoor_kitchen' => ['icon' => 'FiHome', 'name' => 'Outdoor Kitchen'],
        'gazebo' => ['icon' => 'FiHome', 'name' => 'Gazebo/Pergola'],
        'landscaping' => ['icon' => 'FaLeaf', 'name' => 'Professional Landscaping'],
        
        // Luxury & Wellness
        'hot_tub' => ['icon' => 'FaHotTub', 'name' => 'Hot Tub/Jacuzzi'],
        'sauna' => ['icon' => 'FaSpa', 'name' => 'Sauna'],
        'steam_room' => ['icon' => 'FiHome', 'name' => 'Steam Room'],
        'pool' => ['icon' => 'FaSwimmingPool', 'name' => 'Swimming Pool'],
        'gym' => ['icon' => 'FaDumbbell', 'name' => 'Private Gym/Fitness Room'],
        'spa_room' => ['icon' => 'FaSpa', 'name' => 'Spa/Massage Room'],
        'meditation_room' => ['icon' => 'FiHome', 'name' => 'Meditation/Yoga Room'],
        
        // Alpine & Winter Features
        'ski_storage' => ['icon' => 'FiPackage', 'name' => 'Ski Storage Room'],
        'boot_warmer' => ['icon' => 'FiHome', 'name' => 'Boot Warmer/Drying Room'],
        'mountain_view' => ['icon' => 'FiEye', 'name' => 'Mountain Views'],
        'valley_view' => ['icon' => 'FiEye', 'name' => 'Valley Views'],
        'lake_view' => ['icon' => 'FiEye', 'name' => 'Lake Views'],
        'ski_in_out' => ['icon' => 'FaSkiing', 'name' => 'Ski-in/Ski-out Access'],
        'slope_access' => ['icon' => 'FaSkiing', 'name' => 'Direct Slope Access'],
        
        // Family & Accessibility
        'baby_crib' => ['icon' => 'FaBaby', 'name' => 'Baby Crib Available'],
        'high_chair' => ['icon' => 'FiHome', 'name' => 'High Chair'],
        'toys_games' => ['icon' => 'FaGamepad', 'name' => 'Children Toys & Games'],
        'pet_friendly' => ['icon' => 'FaPaw', 'name' => 'Pet Friendly'],
        'smoking_allowed' => ['icon' => 'FiHome', 'name' => 'Smoking Allowed'],
        'quiet_location' => ['icon' => 'FiHome', 'name' => 'Quiet/Secluded Location']
    ];
    
    // Amenity mapping
    $amenityMap = [
        // Internet & Technology
        'wifi' => 'Wi-Fi Internet',
        'cable_tv' => 'Cable/Satellite TV',
        'sound_system' => 'Sound System',
        'workspace' => 'Workspace/Office Area',
        
        // Utilities & Maintenance
        'heating' => 'Central Heating',
        'air_conditioning' => 'Air Conditioning',
        'laundry' => 'Washing Machine',
        'dryer' => 'Dryer',
        'iron' => 'Iron & Ironing Board',
        'cleaning_service' => 'Cleaning Service Available',
        
        // Kitchen Services
        'kitchen_equipped' => 'Fully Equipped Kitchen',
        'dishwasher' => 'Dishwasher',
        'oven' => 'Oven',
        'microwave' => 'Microwave',
        'coffee_machine' => 'Coffee Machine',
        
        // Transportation & Access
        'parking' => 'Parking Space',
        'garage' => 'Private Garage',
        'elevator' => 'Elevator Access',
        'wheelchair_accessible' => 'Wheelchair Accessible',
        
        // Professional Services
        'concierge' => 'Concierge Service',
        'security' => 'Security System',
        'maintenance' => 'Maintenance Service',
        'housekeeping' => 'Housekeeping Service'
    ];
    
    // Process features - use the actual features from database
    $features = [];
    foreach ($featuresList as $featureId) {
        if (isset($featureMap[$featureId])) {
            $features[] = $featureMap[$featureId];
        }
    }
    
    // Process amenities - convert IDs to names
    $amenities = [];
    foreach ($amenitiesList as $amenityId) {
        if (isset($amenityMap[$amenityId])) {
            $amenities[] = $amenityMap[$amenityId];
        }
    }
    
    // Add main image to the gallery images
    $galleryImages = json_decode($chalet['gallery_images'], true) ?: [];
    if ($chalet['main_image'] && !in_array($chalet['main_image'], $galleryImages)) {
        array_unshift($galleryImages, $chalet['main_image']);
    }
    
    // Build location description based on city and canton
    $locationDescription = "Located in the exclusive area of {$chalet['city']}, {$chalet['canton']}. ";
    
    // Add proximity to ski lifts for mountain locations
    if (in_array($chalet['canton'], ['Valais', 'Graubünden', 'Bern', 'Uri'])) {
        $locationDescription .= "The chalet is just " . rand(100, 500) . "m from the ski lifts. ";
    }
    
    $locationDescription .= "Surrounded by breathtaking alpine scenery while being just a short walk from the village center with its restaurants and shops.";
    
    // Process the data to match the format expected by the front-end
    $processedChalet = [
        'id' => $chalet['id'],
        'title' => $chalet['title'],
        'images' => $galleryImages,
        'price' => "₣ " . number_format($chalet['price']),
        'pricePerNight' => "from €" . number_format($chalet['price'] / 20000, 0) . "/night", // Example calculation for nightly rate
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
        'features' => $features, // Now using actual features from database
        'amenities' => $amenities, // Converted amenity IDs to names
        'locationDescription' => $locationDescription,
        'rating' => (float)$chalet['rating'],
        'likes_count' => (int)$chalet['likes_count'],
        'reviews' => (int)$chalet['likes_count'],
        'availability' => 'Year-round',
        'yearBuilt' => $chalet['year_built'],
        'floors' => rand(2, 4),
        'latitude' => (float)$chalet['latitude'],
        'longitude' => (float)$chalet['longitude'],
        'days_on_market' => $chalet['days_on_market']
    ];
    
    // Return the chalet data as JSON
    http_response_code(200);
    echo json_encode($processedChalet);
    
} catch (PDOException $e) {
    // Return error for any database issues
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>