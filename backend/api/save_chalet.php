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

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . $_ENV['REACT_FRONTEND_URL']);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Include PostgreSQL database connection
require_once '../database/db.php';

try {
    // Get the raw POST data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('No data received or invalid JSON');
    }
    
    // Process amenities - ensure it's always an array
    $amenities = [];
    if (isset($data['amenities'])) {
        if (is_array($data['amenities'])) {
            $amenities = $data['amenities'];
        } else if (is_string($data['amenities'])) {
            $amenities = json_decode($data['amenities'], true) ?: [];
        }
    }
    
    // Process features - ensure it's always an array
    $features = [];
    if (isset($data['features'])) {
        if (is_array($data['features'])) {
            $features = $data['features'];
        } else if (is_string($data['features'])) {
            $features = json_decode($data['features'], true) ?: [];
        }
    }
    
    // Convert to JSON strings
    $amenitiesJson = json_encode($amenities);
    $featuresJson = json_encode($features);
    
    // Process gallery images
    $galleryImages = [];
    if (isset($data['gallery_images'])) {
        if (is_array($data['gallery_images'])) {
            $galleryImages = $data['gallery_images'];
        } else if (is_string($data['gallery_images'])) {
            $galleryImages = json_decode($data['gallery_images'], true) ?: [];
        }
    }
    $galleryImagesJson = json_encode($galleryImages);
    
    if (isset($data['id']) && !empty($data['id'])) {
        // UPDATE existing chalet
        $sql = "UPDATE chalets SET 
                title = :title, 
                description = :description, 
                price = :price, 
                beds = :beds, 
                baths = :baths, 
                sqft = :sqft, 
                year_built = :year_built, 
                city = :city, 
                canton = :canton, 
                address = :address, 
                postal_code = :postal_code, 
                latitude = :latitude, 
                longitude = :longitude, 
                status = :status, 
                property_type = :property_type, 
                main_image = :main_image, 
                gallery_images = :gallery_images::jsonb, 
                amenities = :amenities::jsonb, 
                features = :features,
                days_on_market = :days_on_market, 
                user_id = :user_id, 
                updated_at = CURRENT_TIMESTAMP 
                WHERE id = :id";
        
        $stmt = $pdo->prepare($sql);
        
        $params = [
            ':title' => $data['title'],
            ':description' => $data['description'] ?? '',
            ':price' => $data['price'],
            ':beds' => $data['beds'],
            ':baths' => $data['baths'],
            ':sqft' => $data['sqft'],
            ':year_built' => $data['year_built'] ?: null,
            ':city' => $data['city'],
            ':canton' => $data['canton'] ?? '',
            ':address' => $data['address'] ?? '',
            ':postal_code' => $data['postal_code'] ?? '',
            ':latitude' => $data['latitude'] ?: null,
            ':longitude' => $data['longitude'] ?: null,
            ':status' => $data['status'],
            ':property_type' => $data['property_type'],
            ':main_image' => $data['main_image'] ?? '',
            ':gallery_images' => $galleryImagesJson,
            ':amenities' => $amenitiesJson,
            ':features' => $featuresJson,
            ':days_on_market' => $data['days_on_market'] ?? 0,
            ':user_id' => $data['user_id'],
            ':id' => $data['id']
        ];
        
        $result = $stmt->execute($params);
        
        if ($result) {
            // Verify the data was saved
            $checkStmt = $pdo->prepare("SELECT amenities, features FROM chalets WHERE id = ?");
            $checkStmt->execute([$data['id']]);
            $saved = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Chalet updated successfully',
                'id' => $data['id'],
                'saved_amenities' => $saved['amenities'],
                'saved_features' => $saved['features'],
                'debug' => [
                    'received_features' => $features,
                    'features_json' => $featuresJson,
                    'saved_features' => $saved['features']
                ]
            ]);
        } else {
            throw new Exception('Failed to update chalet');
        }
        
    } else {
        // INSERT new chalet
        $sql = "INSERT INTO chalets (
                title, description, price, beds, baths, sqft, year_built, 
                city, canton, address, postal_code, latitude, longitude, 
                status, property_type, main_image, gallery_images, 
                amenities, features, days_on_market, user_id, 
                created_at, updated_at
                ) VALUES (
                :title, :description, :price, :beds, :baths, :sqft, :year_built,
                :city, :canton, :address, :postal_code, :latitude, :longitude,
                :status, :property_type, :main_image, :gallery_images::jsonb,
                :amenities::jsonb, :features, :days_on_market, :user_id,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )";
        
        $stmt = $pdo->prepare($sql);
        
        $params = [
            ':title' => $data['title'],
            ':description' => $data['description'] ?? '',
            ':price' => $data['price'],
            ':beds' => $data['beds'],
            ':baths' => $data['baths'],
            ':sqft' => $data['sqft'],
            ':year_built' => $data['year_built'] ?: null,
            ':city' => $data['city'],
            ':canton' => $data['canton'] ?? '',
            ':address' => $data['address'] ?? '',
            ':postal_code' => $data['postal_code'] ?? '',
            ':latitude' => $data['latitude'] ?: null,
            ':longitude' => $data['longitude'] ?: null,
            ':status' => $data['status'],
            ':property_type' => $data['property_type'],  
            ':main_image' => $data['main_image'] ?? '',
            ':gallery_images' => $galleryImagesJson,
            ':amenities' => $amenitiesJson,
            ':features' => $featuresJson,
            ':days_on_market' => $data['days_on_market'] ?? 0,
            ':user_id' => $data['user_id']
        ];
        
        $result = $stmt->execute($params);
        
        if ($result) {
            $propertyId = $pdo->lastInsertId();
            
            // Verify the data was saved
            $checkStmt = $pdo->prepare("SELECT amenities, features FROM chalets WHERE id = ?");
            $checkStmt->execute([$propertyId]);
            $saved = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Chalet created successfully',
                'id' => $propertyId,
                'saved_amenities' => $saved['amenities'],
                'saved_features' => $saved['features'],
                'debug' => [
                    'received_features' => $features,
                    'features_json' => $featuresJson,
                    'saved_features' => $saved['features']
                ]
            ]);
        } else {
            throw new Exception('Failed to create chalet');
        }
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage(),
        'debug' => [
            'raw_input' => $input,
            'decoded_data' => $data
        ]
    ]);
}
?>