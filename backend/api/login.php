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
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once("../database/db.php");

session_start();

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(["success" => false, "message" => "Missing email or password"]);
    exit;
}

// Get user from database
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password'])) {
    // Check if user is banned/deleted
    if ($user['is_deleted'] == true) {
        echo json_encode([
            "success" => false, 
            "message" => "Your account has been suspended. Please contact support for assistance.",
            "show_contact_link" => true
        ]);
        exit;
    }
    
    // UPDATE LAST LOGIN TIME - NEW CODE
    $updateStmt = $pdo->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?");
    $updateStmt->execute([$user['id']]);
    
    // Store user information in session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['is_admin'] = $user['is_admin'];
    
    // Return success with user data including ID for client-side storage
    echo json_encode([
        "success" => true, 
        "is_admin" => (bool)$user['is_admin'],
        "user_id" => $user['id'],
        "name" => $user['name'] ?? null
    ]);
} else {
    echo json_encode([
        "success" => false, 
        "message" => "Invalid email or password"
    ]);
}
?>