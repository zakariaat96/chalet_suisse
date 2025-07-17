<?php
// contact_form.php - Unified Contact API with Gmail SMTP

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

// Set CORS headers
header('Access-Control-Allow-Origin: ' . $_ENV['REACT_FRONTEND_URL']);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Include PHPMailer
require_once 'PHPMailer/src/Exception.php';
require_once 'PHPMailer/src/PHPMailer.php';
require_once 'PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Gmail SMTP Configuration using environment variables
define('SMTP_HOST', $_ENV['SMTP_HOST']);
define('SMTP_PORT', $_ENV['SMTP_PORT']);
define('SMTP_USERNAME', $_ENV['SMTP_USERNAME']);
define('SMTP_PASSWORD', $_ENV['SMTP_PASSWORD']);
define('FROM_EMAIL', $_ENV['FROM_EMAIL']);
define('FROM_NAME', $_ENV['FROM_NAME']);
define('TO_EMAIL', $_ENV['TO_EMAIL']);
define('TO_NAME', $_ENV['TO_NAME']);

// Get JSON input
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

// Check if JSON was parsed correctly
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid JSON data'
    ]);
    exit;
}

// Determine the type of contact form
$formType = isset($input['formType']) ? $input['formType'] : 'general';

// Validate required fields based on form type
$requiredFields = ['name', 'email', 'message'];
$missingFields = [];

// For newsletter, only email is required
if ($formType === 'newsletter') {
    $requiredFields = ['email'];
}

foreach ($requiredFields as $field) {
    if (!isset($input[$field]) || trim($input[$field]) === '') {
        $missingFields[] = $field;
    }
}

if (!empty($missingFields)) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Missing required fields: ' . implode(', ', $missingFields)
    ]);
    exit;
}

// Validate email format
if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid email format'
    ]);
    exit;
}

// Sanitize inputs
$name = isset($input['name']) ? htmlspecialchars(trim($input['name'])) : '';
$email = trim($input['email']);
$phone = isset($input['phone']) ? htmlspecialchars(trim($input['phone'])) : '';
$message = isset($input['message']) ? htmlspecialchars(trim($input['message'])) : '';
$propertyTitle = isset($input['propertyTitle']) ? htmlspecialchars(trim($input['propertyTitle'])) : '';
$propertyId = isset($input['propertyId']) ? intval($input['propertyId']) : null;

try {
    // Create PHPMailer instance
    $mail = new PHPMailer(true);

    // Gmail SMTP Configuration
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USERNAME;
    $mail->Password = SMTP_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = SMTP_PORT;

    // Optional: Enable debugging (set to 0 for production)
    $mail->SMTPDebug = 0; // Set to 2 for detailed debugging if needed

    // Set from address
    $mail->setFrom(FROM_EMAIL, FROM_NAME);
    $mail->addAddress(TO_EMAIL, TO_NAME);
    
    // Set reply-to address (important for responding to inquiries)
    if (!empty($email) && !empty($name)) {
        $mail->addReplyTo($email, $name);
    }

    $mail->isHTML(true);

    // Handle different form types
    switch ($formType) {
        case 'newsletter':
            handleNewsletterSubscription($mail, $email);
            break;
            
        case 'property_inquiry':
            handlePropertyInquiry($mail, $name, $email, $phone, $message, $propertyTitle, $propertyId);
            break;
            
        case 'chalet_request':
            handleChaletRequest($mail, $name, $email, $phone, $message);
            break;
            
        case 'general':
        default:
            handleGeneralContact($mail, $name, $email, $phone, $message);
            break;
    }

    // Send email
    $mail->send();

    // Return appropriate success message
    $successMessages = [
        'newsletter' => 'Successfully subscribed to our newsletter!',
        'property_inquiry' => 'Your property inquiry has been sent successfully! We will get back to you soon.',
        'chalet_request' => 'Your chalet addition request has been submitted! We will review it and contact you soon.',
        'general' => 'Your message has been sent successfully! We will get back to you soon.'
    ];

    echo json_encode([
        'success' => true,
        'message' => $successMessages[$formType] ?? $successMessages['general']
    ]);

} catch (Exception $e) {
    // Different error messages based on the exception
    $errorMessage = 'Sorry, there was an error sending your message. Please try again later.';
    
    if (strpos($e->getMessage(), 'SMTP connect()') !== false) {
        $errorMessage = 'Unable to connect to email server. Please try again later.';
    } elseif (strpos($e->getMessage(), 'SMTP Error: Could not authenticate') !== false) {
        $errorMessage = 'Email authentication failed. Please contact support.';
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $errorMessage
    ]);
}

// Function to handle newsletter subscription
function handleNewsletterSubscription($mail, $email) {
    $mail->Subject = 'New Newsletter Subscription - Chalets Suisses';
    
    $emailBody = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .content { background-color: #fff; padding: 20px; border-left: 4px solid #007cba; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>📧 New Newsletter Subscription</h2>
            <p>Someone has subscribed to your newsletter.</p>
        </div>
        
        <div class='content'>
            <h3>Subscriber Details</h3>
            <p><strong>Email:</strong> {$email}</p>
            <p><strong>Subscription Date:</strong> " . date('F j, Y \a\t g:i A') . "</p>
        </div>
        
        <hr style='margin: 30px 0; border: none; border-top: 1px solid #ddd;'>
        
        <p style='color: #666; font-size: 12px;'>
            This email was sent from your Chalets Suisses website newsletter form.
        </p>
    </body>
    </html>";
    
    $mail->Body = $emailBody;
    
    $textBody = "New Newsletter Subscription\n\n";
    $textBody .= "Email: {$email}\n";
    $textBody .= "Date: " . date('F j, Y \a\t g:i A') . "\n\n";
    $textBody .= "---\nThis email was sent from your Chalets Suisses website newsletter form.";
    
    $mail->AltBody = $textBody;
}

// Function to handle property inquiries
function handlePropertyInquiry($mail, $name, $email, $phone, $message, $propertyTitle, $propertyId) {
    $mail->Subject = 'New Property Inquiry' . ($propertyTitle ? ' - ' . $propertyTitle : '') . ' - Chalets Suisses';
    
    $emailBody = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .property-info { background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .contact-info { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .message-content { background-color: #fff; padding: 20px; border-left: 4px solid #007cba; margin: 15px 0; }
            .label { font-weight: bold; color: #555; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>🏠 New Property Inquiry</h2>
            <p>You have received a new inquiry from your real estate website.</p>
        </div>
        
        <div class='contact-info'>
            <h3>📋 Contact Information</h3>
            <p><span class='label'>Name:</span> {$name}</p>
            <p><span class='label'>Email:</span> {$email}</p>
            " . ($phone ? "<p><span class='label'>Phone:</span> {$phone}</p>" : "") . "
            <p><span class='label'>Inquiry Date:</span> " . date('F j, Y \a\t g:i A') . "</p>
        </div>";

    if ($propertyTitle || $propertyId) {
        $emailBody .= "
        <div class='property-info'>
            <h3>🏡 Property Information</h3>
            " . ($propertyTitle ? "<p><span class='label'>Property:</span> {$propertyTitle}</p>" : "") . "
            " . ($propertyId ? "<p><span class='label'>Property ID:</span> {$propertyId}</p>" : "") . "
        </div>";
    }

    $emailBody .= "
        <div class='message-content'>
            <h3>💬 Message</h3>
            <p>" . nl2br($message) . "</p>
        </div>
        
        <hr style='margin: 30px 0; border: none; border-top: 1px solid #ddd;'>
        
        <p style='color: #666; font-size: 12px;'>
            This email was sent from your Chalets Suisses website contact form.<br>
            Please reply directly to this email to respond to the inquiry.
        </p>
    </body>
    </html>";

    $mail->Body = $emailBody;

    // Plain text version
    $textBody = "New Property Inquiry\n\n";
    $textBody .= "Contact Information:\n";
    $textBody .= "Name: {$name}\n";
    $textBody .= "Email: {$email}\n";
    if ($phone) $textBody .= "Phone: {$phone}\n";
    $textBody .= "Date: " . date('F j, Y \a\t g:i A') . "\n\n";
    
    if ($propertyTitle || $propertyId) {
        $textBody .= "Property Information:\n";
        if ($propertyTitle) $textBody .= "Property: {$propertyTitle}\n";
        if ($propertyId) $textBody .= "Property ID: {$propertyId}\n\n";
    }
    
    $textBody .= "Message:\n{$message}\n\n";
    $textBody .= "---\nThis email was sent from your Chalets Suisses website contact form.";

    $mail->AltBody = $textBody;
}

// Function to handle chalet addition requests
function handleChaletRequest($mail, $name, $email, $phone, $message) {
    $mail->Subject = 'New Chalet Addition Request - Chalets Suisses';
    
    $emailBody = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .contact-info { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .message-content { background-color: #fff; padding: 20px; border-left: 4px solid #28a745; margin: 15px 0; }
            .label { font-weight: bold; color: #555; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>🏡 New Chalet Addition Request</h2>
            <p>Someone wants to add a new chalet to your website.</p>
        </div>
        
        <div class='contact-info'>
            <h3>📋 Contact Information</h3>
            <p><span class='label'>Name:</span> {$name}</p>
            <p><span class='label'>Email:</span> {$email}</p>
            " . ($phone ? "<p><span class='label'>Phone:</span> {$phone}</p>" : "") . "
            <p><span class='label'>Request Date:</span> " . date('F j, Y \a\t g:i A') . "</p>
        </div>
        
        <div class='message-content'>
            <h3>📝 Chalet Details</h3>
            <p>" . nl2br($message) . "</p>
        </div>
        
        <hr style='margin: 30px 0; border: none; border-top: 1px solid #ddd;'>
        
        <p style='color: #666; font-size: 12px;'>
            This request was sent from your Chalets Suisses user dashboard.<br>
            Please review the details and contact the user for more information.
        </p>
    </body>
    </html>";

    $mail->Body = $emailBody;

    $textBody = "New Chalet Addition Request\n\n";
    $textBody .= "Contact Information:\n";
    $textBody .= "Name: {$name}\n";
    $textBody .= "Email: {$email}\n";
    if ($phone) $textBody .= "Phone: {$phone}\n";
    $textBody .= "Date: " . date('F j, Y \a\t g:i A') . "\n\n";
    $textBody .= "Chalet Details:\n{$message}\n\n";
    $textBody .= "---\nThis request was sent from your Chalets Suisses user dashboard.";

    $mail->AltBody = $textBody;
}

// Function to handle general contact
function handleGeneralContact($mail, $name, $email, $phone, $message) {
    $mail->Subject = 'New Contact Form Message - Chalets Suisses';
    
    $emailBody = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .contact-info { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .message-content { background-color: #fff; padding: 20px; border-left: 4px solid #6c757d; margin: 15px 0; }
            .label { font-weight: bold; color: #555; }
        </style>
    </head>
    <body>
        <div class='header'>
            <h2>📧 New Contact Message</h2>
            <p>You have received a new message from your website contact form.</p>
        </div>
        
        <div class='contact-info'>
            <h3>📋 Contact Information</h3>
            <p><span class='label'>Name:</span> {$name}</p>
            <p><span class='label'>Email:</span> {$email}</p>
            " . ($phone ? "<p><span class='label'>Phone:</span> {$phone}</p>" : "") . "
            <p><span class='label'>Message Date:</span> " . date('F j, Y \a\t g:i A') . "</p>
        </div>
        
        <div class='message-content'>
            <h3>💬 Message</h3>
            <p>" . nl2br($message) . "</p>
        </div>
        
        <hr style='margin: 30px 0; border: none; border-top: 1px solid #ddd;'>
        
        <p style='color: #666; font-size: 12px;'>
            This email was sent from your Chalets Suisses website contact form.<br>
            Please reply directly to this email to respond to the message.
        </p>
    </body>
    </html>";

    $mail->Body = $emailBody;

    $textBody = "New Contact Message\n\n";
    $textBody .= "Contact Information:\n";
    $textBody .= "Name: {$name}\n";
    $textBody .= "Email: {$email}\n";
    if ($phone) $textBody .= "Phone: {$phone}\n";
    $textBody .= "Date: " . date('F j, Y \a\t g:i A') . "\n\n";
    $textBody .= "Message:\n{$message}\n\n";
    $textBody .= "---\nThis email was sent from your Chalets Suisses website contact form.";

    $mail->AltBody = $textBody;
}
?>