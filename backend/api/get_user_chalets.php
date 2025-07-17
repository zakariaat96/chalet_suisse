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

// Allow CORS for React frontend
header("Access-Control-Allow-Origin: " . $_ENV['REACT_FRONTEND_URL']);
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Allow preflight requests (for OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Session settings (for cross-origin cookies)
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_secure', '0');
session_start();

// Check session
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authorized']);
    exit();
}

// Include DB connection
require_once("../database/db.php");

// Get user ID from session
$user_id = $_SESSION['user_id'];

try {
    // Check if user exists
    $userCheck = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $userCheck->execute([$user_id]);
    $user = $userCheck->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode([
            'chalets' => [],
            'debug' => ['message' => "User with ID $user_id not found"]
        ]);
        exit();
    }
    
    // Fetch chalets
    $stmt = $pdo->prepare("SELECT * FROM chalets WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $chalets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return response with debug info
    $response = [
        'chalets' => $chalets,
        'debug' => [
            'user_id' => $user_id,
            'found_chalets' => count($chalets),
            'user_email' => $user['email'] ?? 'unknown'
        ]
    ];
    
    echo json_encode($response);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error',
        'debug' => $e->getMessage()
    ]);
}
?>