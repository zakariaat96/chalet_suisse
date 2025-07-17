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

// Improved CORS headers
header("Access-Control-Allow-Origin: " . $_ENV['REACT_FRONTEND_URL']);
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: OPTIONS, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Max-Age: 3600");

// For preflight OPTIONS request, just return 200 OK
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// For all other requests, add content type
header("Content-Type: application/json");

// Include database connection
require_once("../database/db.php");

try {
    // Get JSON input
    $input = file_get_contents("php://input");
    
    $data = json_decode($input, true);
    
    // Validate input
    if (!isset($data['name']) || !isset($data['email']) || empty($data['name']) || empty($data['email'])) {
        echo json_encode([
            "success" => false,
            "message" => "Name and email are required fields"
        ]);
        exit;
    }

    // Prepare data
    $userId = $data['id'] ?? null;
    $name = $data['name'];
    $email = $data['email'];
    $password = $data['password'] ?? null;
    
    // FIXED: Convert is_admin to integer (0 or 1) for PostgreSQL
    $isAdmin = isset($data['is_admin']) ? (int)$data['is_admin'] : 0;

    // Sanitize input for better security
    $name = htmlspecialchars($name);
    $email = filter_var($email, FILTER_SANITIZE_EMAIL);

    // Check if email already exists (for new users or when changing email)
    $checkEmailQuery = "SELECT id FROM users WHERE email = ? AND id != ?";
    $checkStmt = $pdo->prepare($checkEmailQuery);
    $checkStmt->execute([$email, $userId ?? 0]);
    
    if ($checkStmt->rowCount() > 0) {
        echo json_encode([
            "success" => false,
            "message" => "Email already exists. Please use a different email."
        ]);
        exit;
    }
    
    // If updating an existing user
    if ($userId) {
        // If password is provided, update it too
        if ($password && !empty($password)) {
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $query = "UPDATE users SET name = ?, email = ?, password = ?, is_admin = ? WHERE id = ?";
            $stmt = $pdo->prepare($query);
            $stmt->execute([$name, $email, $hashedPassword, $isAdmin, $userId]);
        } else {
            // Don't update password if not provided
            $query = "UPDATE users SET name = ?, email = ?, is_admin = ? WHERE id = ?";
            $stmt = $pdo->prepare($query);
            $stmt->execute([$name, $email, $isAdmin, $userId]);
        }
        
        $message = "User updated successfully";
    } else {
        // Adding a new user
        if (!$password || empty($password)) {
            echo json_encode([
                "success" => false,
                "message" => "Password is required for new users"
            ]);
            exit;
        }
        
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Use current timestamp for created_at
        $query = "INSERT INTO users (name, email, password, is_admin, created_at, auth_type) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'email')";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$name, $email, $hashedPassword, $isAdmin]);
        
        $userId = $pdo->lastInsertId();
        $message = "User created successfully";
    }
    
    // Get the updated/created user to return to frontend
    $getUserQuery = "SELECT id, name, email, is_admin, created_at FROM users WHERE id = ?";
    $getUserStmt = $pdo->prepare($getUserQuery);
    $getUserStmt->execute([$userId]);
    $user = $getUserStmt->fetch(PDO::FETCH_ASSOC);
    
    // Return success response
    echo json_encode([
        "success" => true,
        "message" => $message,
        "user" => $user
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>