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

// CORS headers - MATCHING YOUR WORKING CODE
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
    
    // Get JSON input - MATCHING YOUR WORKING CODE
    $input = file_get_contents("php://input");
    
    $data = json_decode($input, true);
    $chaletId = $data['id'] ?? null;
    
    // Basic validation
    if (!$chaletId) {
        echo json_encode([
            "success" => false,
            "message" => "Chalet ID is required"
        ]);
        exit;
    }
    
    // Begin transaction to ensure all deletions happen together
    $pdo->beginTransaction();
    
    try {
        // Step 1: Delete from user_favorites table (favorites for this chalet)
        // This removes all users' favorites/likes for this specific chalet
        $query = "DELETE FROM user_favorites WHERE chalet_id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$chaletId]);
        $favoritesDeleted = $stmt->rowCount();
        
        // Step 2: Delete the chalet itself
        $query = "DELETE FROM chalets WHERE id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$chaletId]);
        $chaletDeleted = $stmt->rowCount();
        
        // Commit the transaction - all deletions successful
        $pdo->commit();
        
        if ($chaletDeleted > 0) {
            echo json_encode([
                "success" => true,
                "message" => "Chalet permanently deleted",
                "details" => [
                    "chalet_deleted" => $chaletDeleted,
                    "chalet_favorites_deleted" => $favoritesDeleted
                ]
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Chalet not found or could not be deleted"
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
        "message" => "Database error occurred"
    ]);
}
?>