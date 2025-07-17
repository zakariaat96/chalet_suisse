<?php

if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// CRITICAL: Set CORS headers at the top of the file before any output
header('Access-Control-Allow-Origin: ' . $_ENV['REACT_FRONTEND_URL']);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Respond to preflight OPTIONS request immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Just exit with 200 OK status - very important for CORS preflight
    http_response_code(200);
    exit;
}

// Debug CORS issues
if (isset($_SERVER['HTTP_ORIGIN'])) {
    // Log for debugging
}

// Create uploads directory if it doesn't exist
$upload_dir = '../uploads/chalets/';
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

// Enable error reporting for debugging

// Debug information if needed

// Function to generate error response
function sendError($message, $status = 400) {
    http_response_code($status);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit;
}

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Only POST method is allowed', 405);
}

// Check if file was uploaded
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    $error_message = 'No file uploaded or upload error';
    
    // Add more detailed error message based on the error code
    if (isset($_FILES['image']['error'])) {
        switch ($_FILES['image']['error']) {
            case UPLOAD_ERR_INI_SIZE:
                $error_message = 'The uploaded file exceeds the upload_max_filesize directive in php.ini';
                break;
            case UPLOAD_ERR_FORM_SIZE:
                $error_message = 'The uploaded file exceeds the MAX_FILE_SIZE directive in the HTML form';
                break;
            case UPLOAD_ERR_PARTIAL:
                $error_message = 'The uploaded file was only partially uploaded';
                break;
            case UPLOAD_ERR_NO_FILE:
                $error_message = 'No file was uploaded';
                break;
            case UPLOAD_ERR_NO_TMP_DIR:
                $error_message = 'Missing a temporary folder';
                break;
            case UPLOAD_ERR_CANT_WRITE:
                $error_message = 'Failed to write file to disk';
                break;
            case UPLOAD_ERR_EXTENSION:
                $error_message = 'A PHP extension stopped the file upload';
                break;
        }
    }
    
    sendError($error_message);
}

// Validate file type
$file = $_FILES['image'];
// Use finfo for more reliable MIME type detection
$finfo = new finfo(FILEINFO_MIME_TYPE);
$file_type = $finfo->file($file['tmp_name']);

$allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($file_type, $allowed_types)) {
    sendError("Invalid file type: {$file_type}. Only JPEG, PNG, GIF and WEBP are allowed");
}

// Validate file size (max 5MB)
$max_size = 5 * 1024 * 1024; // 5MB in bytes
if ($file['size'] > $max_size) {
    sendError('File size exceeds the maximum limit of 5MB');
}

// Generate a unique filename to prevent overwriting
$file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
if (empty($file_extension)) {
    // Determine extension from mime type if not available in filename
    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp'
    ];
    $file_extension = $extensions[$file_type] ?? 'jpg';
}

$filename = uniqid('property_') . '_' . time() . '.' . $file_extension;
$upload_path = $upload_dir . $filename;

// Make sure the directory is writable
if (!is_writable($upload_dir)) {
    sendError("Upload directory is not writable. Please check permissions on {$upload_dir}");
}

// Move the file to the uploads directory
if (!move_uploaded_file($file['tmp_name'], $upload_path)) {
    sendError("Failed to move uploaded file to {$upload_path}. Check directory permissions.");
}

// Check if file was actually created
if (!file_exists($upload_path)) {
    sendError("File was not created at {$upload_path}. Unknown error occurred.");
}

// Optimize the image if GD is available (optional)
if (function_exists('imagecreatefromjpeg') && function_exists('imagejpeg')) {
    try {
        // Only optimize JPEGs to keep it simple
        if ($file_type === 'image/jpeg') {
            $image = imagecreatefromjpeg($upload_path);
            if ($image !== false) {
                // Save with 85% quality for a good balance
                imagejpeg($image, $upload_path, 85);
                imagedestroy($image);
            }
        }
    } catch (Exception $e) {
        // Silent fail on optimization - not critical
    }
}

// Return success response with the image path
$image_url = 'uploads/chalets/' . $filename; // Relative path for storage in DB
echo json_encode([
    'success' => true,
    'message' => 'Image uploaded successfully',
    'image_path' => $image_url
]);
exit;