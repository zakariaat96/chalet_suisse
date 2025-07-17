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
$allowedOrigin = $_ENV['REACT_FRONTEND_URL'] ?? 'http://localhost:3000';
header("Access-Control-Allow-Origin: " . $allowedOrigin);
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once("../database/db.php");

session_start();

// Check if session is valid and user exists in database
$response = [
    'logged_in' => false,
    'user_id' => null,
    'email' => null,
    'is_admin' => false,
    'session_id' => session_id()
];

if (isset($_SESSION['user_id']) && isset($_SESSION['email'])) {
    // Verify user still exists in database
    try {
        $stmt = $pdo->prepare("SELECT id, email, is_admin, name FROM users WHERE id = ? AND email = ?");
        $stmt->execute([$_SESSION['user_id'], $_SESSION['email']]);
        $user = $stmt->fetch();
        
        if ($user) {
            $response = [
                'logged_in' => true,
                'user_id' => (int)$user['id'],
                'email' => $user['email'],
                'is_admin' => (bool)$user['is_admin'],
                'name' => $user['name'],
                'session_id' => session_id()
            ];
        } else {
            // User doesn't exist anymore, clear session
            session_destroy();
        }
    } catch (PDOException $e) {
        // Silent fail - no error logging
    }
}

header('Content-Type: application/json');
echo json_encode($response);
?>