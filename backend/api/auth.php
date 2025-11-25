<?php
// --- Authentication API ---

require_once '../db.php';

// Start the session. This must be called before any output is sent.
session_start();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        handle_login($pdo);
        break;
    case 'register':
        handle_register($pdo);
        break;
    case 'verify':
        // Check if user is logged in
        if (!empty($_SESSION['user_id'])) {
            json_response(true, "Session is active.");
        } else {
            json_response(false, "No active session.");
        }
        break;
    case 'logout':
        // Unset all of the session variables.
        $_SESSION = array();
        // Destroy the session.
        session_destroy();
        json_response(true, "Logout successful.");
        break;
    default:
        json_response(false, "Invalid action requested.");
        break;
}

function handle_login($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['email']) || empty($data['password']) || empty($data['user_type'])) {
        json_response(false, "Email, password, and user type are required.");
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND user_type = ?");
    $stmt->execute([$data['email'], $data['user_type']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        json_response(false, "Invalid credentials or user type.");
    }

    if ($user['status'] !== 'active') {
        json_response(false, "Your account is not active.");
    }

    if (password_verify($data['password'], $user['password_hash'])) {
        // Regenerate session ID to prevent session fixation attacks.
        session_regenerate_id(true);

        // Store user info in the session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_type'] = $user['user_type'];
        $_SESSION['full_name'] = $user['full_name'];

        unset($user['password_hash']);

        // No need to send a token for session-based auth, but the frontend expects it.
        // We can send the session ID if needed, but for now, a simple success is fine.
        json_response(true, "Login successful!", [
            'user' => $user,
            'token' => session_id() // Send session ID as token
        ]);
    } else {
        json_response(false, "Invalid credentials.");
    }
}

function handle_register($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['full_name']) || empty($data['email']) || empty($data['password'])) {
        json_response(false, "Full name, email, and password are required.");
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        json_response(false, "An account with this email already exists.");
    }

    $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);

    $stmt = $pdo->prepare(
        "INSERT INTO users (full_name, email, password_hash, phone, user_type, status) VALUES (?, ?, ?, ?, 'student', 'pending')"
    );

    try {
        $stmt->execute([
            $data['full_name'],
            $data['email'],
            $password_hash,
            $data['phone'] ?? null
        ]);

        json_response(true, "Registration successful! Your account is pending admin approval.");
    } catch (PDOException $e) {
        json_response(false, "Database error: " . $e->getMessage());
    }
}
?>
