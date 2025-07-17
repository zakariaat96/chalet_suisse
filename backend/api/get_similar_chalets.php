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

// Enable CORS
header("Access-Control-Allow-Origin: " . $_ENV['REACT_FRONTEND_URL']);
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Validate that we have an ID parameter
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing ID parameter']);
    exit;
}

$id = (int)$_GET['id'];
$beds = isset($_GET['beds']) ? (int)$_GET['beds'] : 0;

$host = $_ENV['DB_HOST'];
$db   = $_ENV['DB_NAME'];
$user = $_ENV['DB_USER'];
$pass = $_ENV['DB_PASS'];
$charset = 'utf8mb4';

require_once '../database/db.php';

try {
    // Find similar chalets (same number of bedrooms, not the same chalet)
    $stmt = $pdo->prepare("
        SELECT * FROM chalets 
        WHERE id != :id 
        AND beds = :beds 
        AND status = 'Available' 
        ORDER BY RANDOM() 
        LIMIT 3
    ");
    
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->bindParam(':beds', $beds, PDO::PARAM_INT);
    $stmt->execute();
    
    $similarChalets = $stmt->fetchAll();
    
    // If we don't have enough similar chalets, get some others
    if (count($similarChalets) < 3) {
        $neededChalets = 3 - count($similarChalets);
        
        $excludeIds = [$id];
        foreach ($similarChalets as $chalet) {
            $excludeIds[] = $chalet['id'];
        }
        
        $placeholders = implode(',', array_fill(0, count($excludeIds), '?'));
        
        $additionalStmt = $pdo->prepare("
            SELECT * FROM chalets 
            WHERE id NOT IN ($placeholders) 
            AND status = 'Available' 
            ORDER BY RANDOM() 
            LIMIT $neededChalets
        ");
        
        foreach ($excludeIds as $i => $excludeId) {
            $additionalStmt->bindValue($i+1, $excludeId, PDO::PARAM_INT);
        }
        
        $additionalStmt->execute();
        $additionalChalets = $additionalStmt->fetchAll();
        
        $similarChalets = array_merge($similarChalets, $additionalChalets);
    }
    
    // Convert to JSON and output
    header('Content-Type: application/json');
    echo json_encode($similarChalets);
    
} catch (\PDOException $e) {
    // Return error as JSON
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>