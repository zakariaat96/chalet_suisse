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

header('Access-Control-Allow-Origin: ' . $_ENV['REACT_FRONTEND_URL']);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, Accept');

// Include the database connection
require_once '../database/db.php';

try {
    // Check if we're looking for deleted or active items
    $viewMode = isset($_GET['view']) ? $_GET['view'] : 'active';
    $is_deleted = ($viewMode === 'trash') ? 'true' : 'false';  // PostgreSQL boolean as string
    
    // Fetch chalets based on deletion status
    $stmt = $pdo->prepare("SELECT * FROM chalets WHERE is_deleted = :is_deleted::boolean ORDER BY created_at DESC");
    $stmt->execute(['is_deleted' => $is_deleted]);
    $chalets = $stmt->fetchAll();
    
    // Process JSON columns - PostgreSQL returns JSONB as strings
    foreach ($chalets as &$chalet) {
        // JSONB columns are already properly formatted in PostgreSQL
        if (isset($chalet['gallery_images']) && is_string($chalet['gallery_images'])) {
            $chalet['gallery_images'] = json_decode($chalet['gallery_images']);
        }
        
        if (isset($chalet['amenities']) && is_string($chalet['amenities'])) {
            $chalet['amenities'] = json_decode($chalet['amenities']);
        }
        
        // Convert boolean strings to actual booleans for consistency
        $chalet['is_deleted'] = filter_var($chalet['is_deleted'], FILTER_VALIDATE_BOOLEAN);
        if (isset($chalet['is_admin'])) {
            $chalet['is_admin'] = filter_var($chalet['is_admin'], FILTER_VALIDATE_BOOLEAN);
        }
    }
    
    // Convert to JSON and output
    header('Content-Type: application/json');
    echo json_encode($chalets, JSON_PRETTY_PRINT);
    
} catch (\PDOException $e) {
    // Return error as JSON
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error fetching properties: ' . $e->getMessage()]);
}
?>