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
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include database connection
require_once("../database/db.php");

// Get JSON input
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

// Get client IP address and session (if available)
$ipAddress = $_SERVER['REMOTE_ADDR'];
$sessionId = session_id() ?: null;

try {
    // Determine user type (registered or guest)
    $userType = isset($input['user_id']) && !empty($input['user_id']) ? 'registered' : 'guest';
    
    // Prepare SQL statement
    $sql = "INSERT INTO search_queries (
                user_id, 
                user_type,
                search_term, 
                location, 
                min_price, 
                max_price, 
                bedrooms, 
                bathrooms, 
                sort_by,
                ip_address,
                session_id
            ) VALUES (
                :user_id,
                :user_type,
                :search_term,
                :location,
                :min_price,
                :max_price,
                :bedrooms,
                :bathrooms,
                :sort_by,
                :ip_address,
                :session_id
            )";
    
    $stmt = $pdo->prepare($sql);
    
    // Bind parameters
    $params = [
        'user_id' => $input['user_id'] ?? null,
        'user_type' => $userType,
        'search_term' => $input['search_term'] ?? null,
        'location' => $input['location'] ?? null,
        'min_price' => $input['min_price'] ? (float)$input['min_price'] : null,
        'max_price' => $input['max_price'] ? (float)$input['max_price'] : null,
        'bedrooms' => $input['bedrooms'] ? (int)$input['bedrooms'] : null,
        'bathrooms' => $input['bathrooms'] ? (int)$input['bathrooms'] : null,
        'sort_by' => $input['sort_by'] ?? null,
        'ip_address' => $ipAddress,
        'session_id' => $sessionId
    ];
    
    $stmt->execute($params);
    
    // Get the ID of the newly inserted record
    $newId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Search query saved successfully',
        'id' => $newId
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error saving search query',
        'error_details' => $e->getMessage()
    ]);
}
?>