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

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $data = json_decode(file_get_contents("php://input"), true);
    $token = $data['token'] ?? '';

    if (!$token) {
        echo json_encode(["success" => false, "message" => "Missing Google token"]);
        exit;
    }

    // Your Google Client ID from environment variable
    $client_id = $_ENV['REACT_APP_GOOGLE_CLIENT_ID'];
    
    // Use cURL for better error handling
    $url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($token);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($curl_error) {
        echo json_encode(["success" => false, "message" => "Network error: " . $curl_error]);
        exit;
    }

    if ($http_code !== 200) {
        echo json_encode(["success" => false, "message" => "Token verification failed. HTTP code: " . $http_code]);
        exit;
    }

    $payload = json_decode($response, true);

    if (!$payload) {
        echo json_encode(["success" => false, "message" => "Invalid token response"]);
        exit;
    }

    // Check for error in Google's response
    if (isset($payload['error'])) {
        echo json_encode(["success" => false, "message" => "Google token error: " . $payload['error']]);
        exit;
    }

    // Verify the token is for our app
    if (!isset($payload['aud']) || $payload['aud'] !== $client_id) {
        echo json_encode(["success" => false, "message" => "Token not for this application"]);
        exit;
    }

    // Verify token is not expired
    if (!isset($payload['exp']) || time() > $payload['exp']) {
        echo json_encode(["success" => false, "message" => "Token expired"]);
        exit;
    }

    // Extract user info
    $email = $payload['email'] ?? '';
    $name = $payload['name'] ?? '';
    $google_id = $payload['sub'] ?? '';

    if (!$email) {
        echo json_encode(["success" => false, "message" => "No email in token"]);
        exit;
    }

    // Check if user already exists
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $existing_user = $stmt->fetch();

    $new_user = false;

    if (!$existing_user) {
        // Create new user for Google registration
        $stmt = $pdo->prepare("INSERT INTO users (email, name, password, is_admin, created_at, auth_type) VALUES (?, ?, ?, false, CURRENT_TIMESTAMP, 'google')");
        // Use a placeholder password since Google users don't need one
        $placeholder_password = password_hash(uniqid() . time(), PASSWORD_DEFAULT);
        $stmt->execute([$email, $name, $placeholder_password]);
        
        $user_id = $pdo->lastInsertId();
        $is_admin = false;
        $new_user = true;
    } else {
        // BAN CHECK - ONLY NEW CODE ADDED HERE
        if ($existing_user['is_deleted'] == true) {
            echo json_encode([
                "success" => false, 
                "message" => "This email was previously associated with a suspended account. Please contact support for assistance.",
                "show_contact_link" => true
            ]);
            exit;
        }
        
        // User already exists - just return their info
        $user_id = $existing_user['id'];
        $is_admin = $existing_user['is_admin'];
        
        // Update name if it's different and not empty
        if ($name && $existing_user['name'] !== $name) {
            $stmt = $pdo->prepare("UPDATE users SET name = ? WHERE id = ?");
            $stmt->execute([$name, $user_id]);
        }
    }

    // Store user information in session
    $_SESSION['user_id'] = $user_id;
    $_SESSION['email'] = $email;
    $_SESSION['is_admin'] = $is_admin;

    echo json_encode([
        "success" => true,
        "user_id" => $user_id,
        "email" => $email,
        "name" => $name,
        "is_admin" => (bool)$is_admin,
        "new_user" => $new_user // This tells the frontend if it's a new registration or existing user
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>