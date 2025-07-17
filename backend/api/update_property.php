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

// Set CORS headers properly
header('Access-Control-Allow-Origin: ' . $_ENV['REACT_FRONTEND_URL']);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request - this is critical for CORS to work
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Return 200 response code for preflight
    http_response_code(200);
    exit;
}

// Include database connection
require_once("../database/db.php");

// Get JSON input
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

// Validate input
if (!isset($input['id']) || empty($input['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Property ID is required']);
    exit;
}

// Required fields validation
$requiredFields = ['title', 'price', 'beds', 'baths', 'sqft', 'user_id', 'city', 'postal_code'];
$missingFields = [];

foreach ($requiredFields as $field) {
    if (!isset($input[$field]) || (is_string($input[$field]) && trim($input[$field]) === '')) {
        $missingFields[] = $field;
    }
}

if (!empty($missingFields)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields: ' . implode(', ', $missingFields)]);
    exit;
}

// Validate user_id exists in the database
try {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = :user_id AND is_deleted = false");
    $stmt->execute(['user_id' => $input['user_id']]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Selected user does not exist or has been deleted']);
        exit;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error when validating user: ' . $e->getMessage()]);
    exit;
}

try {
    // Build the query dynamically based on provided fields
    $fields = [];
    $params = ['id' => $input['id']];
    
    // Map the fields from the request to database columns - FIXED: Added missing fields
    $allowedFields = [
        'title', 
        'description', 
        'price', 
        'beds', 
        'baths', 
        'sqft', 
        'status', 
        'property_type', 
        'main_image', 
        'address', 
        'city', 
        'canton', 
        'postal_code', 
        'latitude',         // Added this
        'longitude',        // Added this
        'year_built',       // Added this
        'days_on_market',   // Added this
        'user_id', 
        'gallery_images', 
        'amenities',
        'features'          // FIXED: This was missing!
    ];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            // Special handling for JSON fields
            if (in_array($field, ['gallery_images', 'amenities', 'features']) && is_array($input[$field])) {
                $fields[] = "$field = :$field";
                $params[$field] = json_encode($input[$field]);
            } else {
                $fields[] = "$field = :$field";
                $params[$field] = $input[$field];
            }
        }
    }
    
    // Add updated_at timestamp
    $fields[] = "updated_at = CURRENT_TIMESTAMP";
    
    // Build and execute the update query
    if (!empty($fields)) {
        $sql = "UPDATE chalets SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Check if any rows were affected
        if ($stmt->rowCount() > 0 || true) { // Always return the property, even if no fields changed
            // Fetch the updated property to return with user info
            $fetchStmt = $pdo->prepare("SELECT c.*, u.name as user_name, u.email as user_email 
                                      FROM chalets c
                                      JOIN users u ON c.user_id = u.id
                                      WHERE c.id = :id");
            $fetchStmt->execute(['id' => $input['id']]);
            $property = $fetchStmt->fetch(PDO::FETCH_ASSOC);
            
            // Process JSON fields
            if (isset($property['gallery_images']) && !is_null($property['gallery_images'])) {
                $property['gallery_images'] = json_decode($property['gallery_images']);
            }
            
            if (isset($property['amenities']) && !is_null($property['amenities'])) {
                $property['amenities'] = json_decode($property['amenities']);
            }
            
            // FIXED: Added features processing
            if (isset($property['features']) && !is_null($property['features'])) {
                $property['features'] = json_decode($property['features']);
            }
            
            echo json_encode([
                'success' => true, 
                'message' => 'Property updated successfully',
                'property' => $property
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Property not found or no changes made']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Database error: ' . $e->getMessage(),
        'error_details' => $e->getMessage()
    ]);
}
?>