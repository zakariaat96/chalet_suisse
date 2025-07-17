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

// Debug: Check if PDO connection exists
if (!isset($pdo)) {
    echo json_encode(["success" => false, "message" => "Database connection not established"]);
    exit;
}

try {
    // Debug: Test database connection
    $testStmt = $pdo->query("SELECT 1");
    if (!$testStmt) {
        echo json_encode(["success" => false, "message" => "Database connection test failed"]);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    if (!$email || !$password) {
        echo json_encode(["success" => false, "message" => "Email and password are required"]);
        exit;
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "message" => "Invalid email format"]);
        exit;
    }

    // Validate password length
    if (strlen($password) < 6) {
        echo json_encode(["success" => false, "message" => "Password must be at least 6 characters long"]);
        exit;
    }

    // Check if user already exists - PostgreSQL specific
    $stmt = $pdo->prepare("SELECT id, is_deleted FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingUser) {
        // PostgreSQL returns 't' or 'f' for boolean, or true/false depending on PDO settings
        $isDeleted = ($existingUser['is_deleted'] === true || 
                      $existingUser['is_deleted'] === 't' || 
                      $existingUser['is_deleted'] === '1' ||
                      $existingUser['is_deleted'] === 1);
        
        if ($isDeleted) {
            // User was previously banned/deleted
            echo json_encode([
                "success" => false, 
                "message" => "This email was previously associated with a suspended account. Please contact support for assistance.",
                "show_contact_link" => true
            ]);
        } else {
            // Active user already exists
            echo json_encode(["success" => false, "message" => "Email already registered"]);
        }
        exit;
    }

    // Hash the password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user - PostgreSQL specific syntax with auth_type
    // Use empty string for name since it's required but not provided in the registration form
    $name = ''; // Or use: substr($email, 0, strpos($email, '@')) to use email prefix as name
    
    // UPDATED: Include auth_type column with 'email' value for regular registration
    $stmt = $pdo->prepare("INSERT INTO users (email, password, name, is_admin, created_at, is_deleted, auth_type) VALUES (?, ?, ?, FALSE, NOW(), FALSE, 'email')");
    
    if ($stmt->execute([$email, $hashed_password, $name])) {
        echo json_encode([
            "success" => true, 
            "message" => "Registration successful! Please log in."
        ]);
    } else {
        echo json_encode([
            "success" => false, 
            "message" => "Registration failed. Please try again."
        ]);
    }

} catch (PDOException $e) {
    // PostgreSQL unique constraint violation
    if ($e->getCode() == '23505') {
        echo json_encode(["success" => false, "message" => "Email already registered"]);
    } else {
        // For debugging - remove in production
        error_log("Registration PDO Error: " . $e->getMessage());
        error_log("Error Code: " . $e->getCode());
        
        echo json_encode([
            "success" => false, 
            "message" => "Database error occurred: " . $e->getMessage(),
            "error_code" => $e->getCode(),
            "error_info" => $pdo->errorInfo()
        ]);
    }
} catch (Exception $e) {
    error_log("Registration Error: " . $e->getMessage());
    echo json_encode([
        "success" => false, 
        "message" => "An error occurred during registration: " . $e->getMessage()
    ]);
}
?>