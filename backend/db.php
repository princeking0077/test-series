<?php
// --- Database Connection Manager ---

// Load the database credentials from the untracked config file
require_once 'config.php';

// --- Establish Connection ---
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    // Return a generic error message in a JSON format for API consistency.
    // Avoid leaking sensitive connection details.
    http_response_code(500); // Internal Server Error
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed. Please check server configuration.'
    ]);
    exit;
}

// --- API Helper Function ---
function json_response($success, $message, $data = null) {
    header('Content-Type: application/json');
    $response = ['success' => $success, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit;
}

// Set default timezone if not set in php.ini
date_default_timezone_set('UTC');

?>
