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
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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
    // Get view mode (active or trash)
    $viewMode = $_GET['view'] ?? 'active';
    
    // Get action for POST requests
    $action = $_GET['action'] ?? '';
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle POST actions (trash, restore, delete)
        $input = json_decode(file_get_contents('php://input'), true);
        $propertyId = $input['id'] ?? 0;
        
        if (!$propertyId) {
            echo json_encode(['success' => false, 'error' => 'Property ID is required']);
            exit;
        }
        
        switch($action) {
            case 'trash':
                $stmt = $pdo->prepare("UPDATE chalets SET is_deleted = true WHERE id = ?");
                $stmt->execute([$propertyId]);
                echo json_encode(['success' => true, 'message' => 'Property moved to trash']);
                break;
                
            case 'restore':
                $stmt = $pdo->prepare("UPDATE chalets SET is_deleted = false WHERE id = ?");
                $stmt->execute([$propertyId]);
                echo json_encode(['success' => true, 'message' => 'Property restored']);
                break;
                
            case 'delete':
                $stmt = $pdo->prepare("DELETE FROM chalets WHERE id = ?");
                $stmt->execute([$propertyId]);
                echo json_encode(['success' => true, 'message' => 'Property permanently deleted']);
                break;
                
            default:
                echo json_encode(['success' => false, 'error' => 'Invalid action']);
        }
        exit;
    }
    
    // Handle GET requests - fetch properties
    if ($viewMode === 'active') {
        // Fetch active properties with likes count
        $query = "SELECT c.*, 
                        (SELECT COUNT(*) FROM user_favorites WHERE chalet_id = c.id) as likes_count,
                        u.name as owner_name 
                  FROM chalets c 
                  LEFT JOIN users u ON c.user_id = u.id 
                  WHERE c.is_deleted = false 
                  ORDER BY c.created_at DESC";
    } else {
        // Fetch trashed properties with likes count
        $query = "SELECT c.*, 
                        (SELECT COUNT(*) FROM user_favorites WHERE chalet_id = c.id) as likes_count,
                        u.name as owner_name 
                  FROM chalets c 
                  LEFT JOIN users u ON c.user_id = u.id 
                  WHERE c.is_deleted = true 
                  ORDER BY c.created_at DESC";
    }
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    
    $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Ensure likes_count is always a number
    foreach ($properties as &$property) {
        $property['likes_count'] = intval($property['likes_count']);
    }
    
    echo json_encode($properties);
    
} catch (Exception $e) {
    echo json_encode(['error' => 'Error fetching properties: ' . $e->getMessage()]);
}
?>