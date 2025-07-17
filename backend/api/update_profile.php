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

// Get profile data from POST
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if (!isset($data['name']) || empty(trim($data['name']))) {
    echo json_encode(['success' => false, 'message' => 'Name is required']);
    exit;
}

$name = trim($data['name']);
$email = isset($data['email']) ? trim($data['email']) : null;
$old_password = isset($data['oldPassword']) ? $data['oldPassword'] : null;
$new_password = isset($data['newPassword']) ? $data['newPassword'] : null;

try {
    // Get current user data to check if they're a Google user
    // FIXED: Using auth_type instead of google_id
    $query = "SELECT name, email, password, auth_type FROM users WHERE id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    
    // FIXED: Check if user is Google user based on auth_type
    $is_google_user = ($user['auth_type'] === 'google');
    
    // Start building the update query
    $update_fields = [];
    $update_values = [];
    
    // Always update name
    $update_fields[] = "name = ?";
    $update_values[] = $name;
    
    // Only update email for non-Google users
    if (!$is_google_user && $email) {
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Invalid email format']);
            exit;
        }
        
        // Check if email already exists for another user
        $email_check_query = "SELECT id FROM users WHERE email = ? AND id != ?";
        $email_check_stmt = $pdo->prepare($email_check_query);
        $email_check_stmt->execute([$email, $user_id]);
        
        if ($email_check_stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Email already exists']);
            exit;
        }
        
        $update_fields[] = "email = ?";
        $update_values[] = $email;
    }
    
    // Handle password update for non-Google users
    if (!$is_google_user && $old_password && $new_password) {
        // Validate new password length
        if (strlen($new_password) < 6) {
            echo json_encode(['success' => false, 'message' => 'New password must be at least 6 characters long']);
            exit;
        }
        
        // Verify old password
        if (!password_verify($old_password, $user['password'])) {
            echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
            exit;
        }
        
        // Hash the new password
        $new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);
        $update_fields[] = "password = ?";
        $update_values[] = $new_password_hash;
    }
    
    // Add user ID for WHERE clause
    $update_values[] = $user_id;
    
    // Build and execute the update query
    $update_query = "UPDATE users SET " . implode(', ', $update_fields) . " WHERE id = ?";
    $update_stmt = $pdo->prepare($update_query);
    $result = $update_stmt->execute($update_values);
    
    if ($result) {
        // Update session data
        $_SESSION['user_name'] = $name;
        if (!$is_google_user && $email) {
            $_SESSION['user_email'] = $email;
        }
        
        echo json_encode([
            'success' => true, 
            'message' => 'Profile updated successfully',
            'user' => [
                'name' => $name,
                'email' => $is_google_user ? $user['email'] : ($email ?: $user['email']),
                'is_google_user' => $is_google_user
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update profile']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>