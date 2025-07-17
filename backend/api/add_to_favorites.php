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

// Fix CORS for credentials - using environment variable
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

// Start session first
session_start();

// Include database connection
require_once '../database/db.php';

// Check if user is logged in
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
    // Test database connection
    if (!$pdo) {
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
    
    // Check if already favorited
    $check_stmt = $pdo->prepare("SELECT id FROM user_favorites WHERE user_id = ? AND chalet_id = ?");
    $check_result = $check_stmt->execute([$user_id, $chalet_id]);
    
    if (!$check_result) {
        echo json_encode(['success' => false, 'message' => 'Failed to check existing favorites']);
        exit;
    }
    
    $existing = $check_stmt->fetch();

    if ($existing) {
        echo json_encode(['success' => true, 'message' => 'Chalet already in favorites']);
        exit;
    }

    // Add to favorites
    $insert_stmt = $pdo->prepare("INSERT INTO user_favorites (user_id, chalet_id) VALUES (?, ?)");
    $result = $insert_stmt->execute([$user_id, $chalet_id]);
    
    if ($result) {
        // Double-check it was inserted
        $verify_stmt = $pdo->prepare("SELECT COUNT(*) as count FROM user_favorites WHERE user_id = ? AND chalet_id = ?");
        $verify_stmt->execute([$user_id, $chalet_id]);
        $verify_result = $verify_stmt->fetch();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Chalet added to favorites'
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add chalet to favorites']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'General error: ' . $e->getMessage()]);
}
?>