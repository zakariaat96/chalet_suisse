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
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// For preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include database connection
require_once("../database/db.php");

try {
    // Start session
    session_start();
    
    // Get JSON input
    $input = file_get_contents("php://input");
    
    $data = json_decode($input, true);
    $userId = $data['userId'] ?? null;
    
    // Basic validation
    if (!$userId) {
        echo json_encode([
            "success" => false,
            "message" => "User ID is required"
        ]);
        exit;
    }
    
    // Begin transaction to ensure all deletions happen together
    $pdo->beginTransaction();
    
    try {
        // Step 1: Delete from user_favorites table (user's liked chalets)
        $query = "DELETE FROM user_favorites WHERE user_id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId]);
        $favoritesDeleted = $stmt->rowCount();
        
        // Step 2: Delete from user_favorites table (favorites of user's chalets)
        // This removes any favorites that other users have on this user's chalets
        $query = "DELETE FROM user_favorites WHERE chalet_id IN (SELECT id FROM chalets WHERE user_id = ?)";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId]);
        $chaletFavoritesDeleted = $stmt->rowCount();
        
        // Step 3: Delete all chalets owned by this user
        $query = "DELETE FROM chalets WHERE user_id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId]);
        $chaletsDeleted = $stmt->rowCount();
        
        // Step 4: Finally, delete the user from users table
        $query = "DELETE FROM users WHERE id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId]);
        $userDeleted = $stmt->rowCount();
        
        // Commit the transaction - all deletions successful
        $pdo->commit();
        
        if ($userDeleted > 0) {
            echo json_encode([
                "success" => true,
                "message" => "User permanently deleted",
                "details" => [
                    "user_deleted" => $userDeleted,
                    "user_favorites_deleted" => $favoritesDeleted,
                    "chalets_deleted" => $chaletsDeleted,
                    "chalet_favorites_deleted" => $chaletFavoritesDeleted
                ]
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "User not found or could not be deleted"
            ]);
        }
        
    } catch (Exception $e) {
        // Rollback the transaction if something goes wrong
        $pdo->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>