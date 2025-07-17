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
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
    // Start session to check if user is logged in
    session_start();
    
    
    // Fetch only active (non-deleted) users with count of favorites AND owned chalets AND last_login
    $query = "SELECT u.*, 
                    (SELECT COUNT(*) FROM user_favorites WHERE user_id = u.id) as liked_chalets_count,
                    (SELECT COUNT(*) FROM chalets WHERE user_id = u.id AND is_deleted = false) as owned_chalets_count 
              FROM users u 
              WHERE u.is_deleted = false 
              ORDER BY u.created_at DESC";
              
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "success" => true,
        "users" => $users
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error fetching users: " . $e->getMessage()
    ]);
}
?>