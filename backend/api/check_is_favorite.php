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
$allowedOrigin = $_ENV['REACT_FRONTEND_URL'] ?? 'http://localhost:3000';
header("Access-Control-Allow-Origin: " . $allowedOrigin);
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Include database connection
require_once '../database/db.php';

// Check if user is logged in
session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Get user ID from session
$user_id = $_SESSION['user_id'];

// Get chalet ID from POST data
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if (!isset($data['chaletId']) || empty($data['chaletId'])) {
    echo json_encode(['success' => false, 'message' => 'Chalet ID is required']);
    exit;
}

$chalet_id = $data['chaletId'];

try {
    // Check if chalet is in user's favorites
    $query = "SELECT id FROM user_favorites WHERE user_id = ? AND chalet_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$user_id, $chalet_id]);
    
    $isFavorite = $stmt->rowCount() > 0;
    
    echo json_encode(['success' => true, 'isFavorite' => $isFavorite]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
?>