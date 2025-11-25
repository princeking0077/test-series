<?php
// --- Centralized Authentication and Authorization Check ---

// Start or resume the session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Checks if a user is authenticated.
 * If not, it sends a JSON error response and terminates the script.
 */
function require_auth() {
    if (empty($_SESSION['user_id'])) {
        http_response_code(401); // Unauthorized
        json_response(false, "Authentication required. Please log in.");
    }
}

/**
 * Checks if the authenticated user is an admin.
 * If not, it sends a JSON error response and terminates the script.
 */
function require_admin() {
    require_auth(); // First, ensure user is logged in
    if ($_SESSION['user_type'] !== 'admin') {
        http_response_code(403); // Forbidden
        json_response(false, "Administrator access required.");
    }
}

/**
 * Gets the authenticated user's ID from the session.
 * @return int|null The user ID or null if not authenticated.
 */
function get_session_user_id() {
    return $_SESSION['user_id'] ?? null;
}

?>
