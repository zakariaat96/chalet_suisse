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

// Set CORS headers using environment variable - THIS WILL WORK FOR HOSTING!
$allowedOrigin = $_ENV['REACT_FRONTEND_URL'] ?? 'http://localhost:3000';
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include database connection (this will use environment variables from db.php)
require_once("../database/db.php");

// Get JSON input
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

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
    // Prepare empty arrays for fields and parameters
    $fields = [];
    $placeholders = [];
    $params = [];

    // Add default values for JSON fields
    $defaults = [
        'gallery_images' => '[]',
        'amenities' => '[]',
        'features' => '[]',
        'is_deleted' => false,  // Changed from 0 to false for PostgreSQL
        'days_on_market' => 0,
    ];

    // Map input fields to database columns
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
        'latitude',
        'longitude',
        'year_built',
        'gallery_images',
        'amenities',
        'features',
        'is_deleted',
        'days_on_market',
        'user_id'
    ];

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $fields[] = $field;
            $placeholders[] = ":$field";
            
            // Special handling for JSON fields
            if (in_array($field, ['gallery_images', 'amenities', 'features']) && is_array($input[$field])) {
                $params[$field] = json_encode($input[$field]);
            } else {
                $params[$field] = $input[$field];
            }
        } else if (isset($defaults[$field])) {
            $fields[] = $field;
            $placeholders[] = ":$field";
            $params[$field] = $defaults[$field];
        }
    }

    // Add created_at and updated_at timestamps
    $fields[] = 'created_at';
    $placeholders[] = 'CURRENT_TIMESTAMP';  // Changed from NOW() to CURRENT_TIMESTAMP for PostgreSQL
    $fields[] = 'updated_at';
    $placeholders[] = 'CURRENT_TIMESTAMP';  // Changed from NOW() to CURRENT_TIMESTAMP for PostgreSQL

    // Build and execute the insert query
    $sql = "INSERT INTO chalets (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Get the newly inserted ID
    $newId = $pdo->lastInsertId();

    // Fetch the full property data to return
    $stmt = $pdo->prepare("SELECT c.*, u.name as user_name, u.email as user_email FROM chalets c JOIN users u ON c.user_id = u.id WHERE c.id = :id");
    $stmt->execute(['id' => $newId]);
    $newProperty = $stmt->fetch(PDO::FETCH_ASSOC);

    // Process JSON columns for the response
    if (isset($newProperty['gallery_images']) && !is_null($newProperty['gallery_images'])) {
        $newProperty['gallery_images'] = json_decode($newProperty['gallery_images']);
    }
    if (isset($newProperty['amenities']) && !is_null($newProperty['amenities'])) {
        $newProperty['amenities'] = json_decode($newProperty['amenities']);
    }
    if (isset($newProperty['features']) && !is_null($newProperty['features'])) {
        $newProperty['features'] = json_decode($newProperty['features']);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Property added successfully',
        'id' => $newId,
        'property' => $newProperty
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage(),
        'error_details' => $e->getMessage()
    ]);
}
?>