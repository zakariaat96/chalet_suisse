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
require_once '../database/db.php';

// Check if user is logged in
session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

// Get user ID from session
$user_id = $_SESSION['user_id'];

// Get password data from POST
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if (!isset($data['oldPassword']) || !isset($data['newPassword'])) {
    echo json_encode(['success' => false, 'message' => 'Both old and new passwords are required']);
    exit;
}

$old_password = $data['oldPassword'];
$new_password = $data['newPassword'];

// Validate new password - must be at least 6 characters
if (strlen($new_password) < 6) {
    echo json_encode(['success' => false, 'message' => 'New password must be at least 6 characters long']);
    exit;
}

try {
    // Get the current password hash for the user
    $query = "SELECT password FROM users WHERE id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    
    // Verify old password
    if (!password_verify($old_password, $user['password'])) {
        echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
        exit;
    }
    
    // Hash the new password
    $new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);
    
    // Update the password
    $update_query = "UPDATE users SET password = ? WHERE id = ?";
    $update_stmt = $pdo->prepare($update_query);
    $result = $update_stmt->execute([$new_password_hash, $user_id]);
    
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Password updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update password']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>