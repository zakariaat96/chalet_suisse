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

header('Access-Control-Allow-Origin: ' . $_ENV['REACT_FRONTEND_URL']);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, Accept');

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

// Validate input
if (!isset($input['id']) || empty($input['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Property ID is required']);
    exit;
}

$propertyId = (int)$input['id'];

try {
    // Mark property as deleted (soft delete)
    $stmt = $pdo->prepare("UPDATE chalets SET is_deleted = true, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
    $stmt->execute(['id' => $propertyId]);
    
    // Check if any rows were affected
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Property moved to trash successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Property not found or already in trash']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>