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

// Fix CORS for credentials
header("Access-Control-Allow-Origin: " . $_ENV['REACT_FRONTEND_URL']); // Your React app origin
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Include database connection
require_once '../database/db.php';

// The connection should now be available as $pdo

// Check if user is logged in
session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Get user ID from session
$user_id = $_SESSION['user_id'];

try {
    // Get favorites with chalet details
    $query = "SELECT c.* FROM chalets c 
              INNER JOIN user_favorites f ON c.id = f.chalet_id 
              WHERE f.user_id = ?
              ORDER BY f.created_at DESC";
              
    $stmt = $pdo->prepare($query);
    $stmt->execute([$user_id]);
    $favorites = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'favorites' => $favorites]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>