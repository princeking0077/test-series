<?php
// --- Admin API ---

require_once '../db.php';
require_once '../auth_check.php';

require_admin();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'dashboard':
        get_admin_dashboard($pdo);
        break;
    case 'users':
        get_users($pdo);
        break;
    case 'update_user':
        update_user_status($pdo);
        break;
    case 'tests':
        get_admin_tests($pdo);
        break;
    case 'create_test':
        create_test($pdo);
        break;
    case 'delete_test':
        delete_test($pdo);
        break;
    case 'get_all_results':
        get_all_results($pdo);
        break;
    case 'change_password':
        change_admin_password($pdo);
        break;
    default:
        json_response(false, "Invalid admin action.");
}

// --- Function Definitions ---

function get_admin_dashboard($pdo) {
    $stats = [];
    $stats['total_students'] = $pdo->query("SELECT COUNT(*) FROM users WHERE user_type = 'student'")->fetchColumn();
    $stats['pending_users'] = $pdo->query("SELECT COUNT(*) FROM users WHERE status = 'pending'")->fetchColumn();
    $stats['active_tests'] = $pdo->query("SELECT COUNT(*) FROM tests WHERE is_active = 1")->fetchColumn();
    $stats['total_attempts'] = $pdo->query("SELECT COUNT(*) FROM test_attempts")->fetchColumn();
    json_response(true, "Dashboard data loaded.", $stats);
}

function get_users($pdo) {
    $status = $_GET['status'] ?? 'pending';
    $stmt = $pdo->prepare("SELECT id, full_name, email, phone, status FROM users WHERE user_type = 'student' AND status = ?");
    $stmt->execute([$status]);
    json_response(true, "Users loaded.", $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function update_user_status($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("UPDATE users SET status = ? WHERE id = ?");
    if ($stmt->execute([$data['status'], $data['user_id']])) {
        json_response(true, "User status updated successfully.");
    } else {
        json_response(false, "Failed to update user status.");
    }
}

function get_admin_tests($pdo) {
    $tests = $pdo->query("SELECT * FROM tests ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
    json_response(true, "Tests loaded.", $tests);
}

function create_test($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $sql = "INSERT INTO tests (test_title, course_id, duration_minutes, total_marks, available_from, available_until) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['test_title'],
        $data['course_id'],
        $data['duration_minutes'],
        $data['total_marks'],
        $data['available_from'] ?? null,
        $data['available_until'] ?? null
    ]);
    json_response(true, "Test created successfully.");
}

function delete_test($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("DELETE FROM tests WHERE id = ?");
    $stmt->execute([$data['test_id']]);
    json_response(true, "Test deleted successfully.");
}

function get_all_results($pdo) {
    $sql = "SELECT r.*, u.full_name as user_name, t.test_title
            FROM results r
            JOIN users u ON r.user_id = u.id
            JOIN tests t ON r.test_id = t.id
            ORDER BY r.created_at DESC";
    $results = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    json_response(true, "All results loaded.", $results);
}

function change_admin_password($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $admin_id = get_session_user_id(); // Get admin ID from session
    $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    if ($stmt->execute([$password_hash, $admin_id])) {
        json_response(true, "Password updated successfully.");
    } else {
        json_response(false, "Failed to update password.");
    }
}
?>
