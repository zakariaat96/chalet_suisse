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
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Include database connection
require_once '../database/db.php'; // Make sure this path is correct

// The connection should now be available as $pdo

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
    // Remove from favorites
    $delete_stmt = $pdo->prepare("DELETE FROM user_favorites WHERE user_id = ? AND chalet_id = ?");
    $result = $delete_stmt->execute([$user_id, $chalet_id]);

    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Chalet removed from favorites']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to remove chalet from favorites']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>