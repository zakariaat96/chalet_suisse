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
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json");

require_once("../database/db.php");

// Get the email parameter from query string
$email = $_GET['email'] ?? '';
$excludeId = $_GET['excludeId'] ?? 0;

if (empty($email)) {
    echo json_encode([
        "success" => false,
        "message" => "Email parameter is required"
    ]);
    exit;
}

try {
    // Sanitize the email
    $email = filter_var($email, FILTER_SANITIZE_EMAIL);
    
    // Check if email exists
    $query = "SELECT id FROM users WHERE email = ? AND id != ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$email, $excludeId]);
    
    $exists = $stmt->rowCount() > 0;
    
    echo json_encode([
        "success" => true,
        "exists" => $exists,
        "message" => $exists ? "Email already exists" : "Email is available"
    ]);
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error checking email: " . $e->getMessage()
    ]);
}