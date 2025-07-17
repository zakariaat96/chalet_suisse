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

// CORS headers
header("Access-Control-Allow-Origin: " . $_ENV['REACT_FRONTEND_URL']);
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// For preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include database connection
require_once("../database/db.php");

try {
    // Start session
    session_start();
    
    // Get JSON input
    $input = file_get_contents("php://input");
    
    $data = json_decode($input, true);
    $userId = $data['userId'] ?? null;
    
    // Basic validation
    if (!$userId) {
        echo json_encode([
            "success" => false,
            "message" => "User ID is required"
        ]);
        exit;
    }
    
    // Mark the user as not deleted (restore)
    $query = "UPDATE users SET is_deleted = false WHERE id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$userId]);
    
    // Check if user was updated
    $rowCount = $stmt->rowCount();
    
    if ($rowCount > 0) {
        echo json_encode([
            "success" => true,
            "message" => "User restored successfully"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "User not found or could not be restored"
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>