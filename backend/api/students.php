<?php
// --- Students API ---

require_once '../db.php';
require_once '../auth_check.php';

require_auth();
$user_id = get_session_user_id();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'dashboard':
        get_student_dashboard($pdo, $user_id);
        break;
    case 'courses':
        get_available_courses($pdo);
        break;
    case 'enroll':
        enroll_in_course($pdo, $user_id);
        break;
    case 'tests':
        get_available_tests($pdo, $user_id);
        break;
    default:
        json_response(false, "Invalid student action.");
}

// --- Function Definitions ---

function get_student_dashboard($pdo, $user_id) {
    $stats = [];

    $stmt_completed = $pdo->prepare("SELECT COUNT(*) FROM test_attempts WHERE user_id = ? AND status = 'completed'");
    $stmt_completed->execute([$user_id]);
    $stats['completed_tests'] = $stmt_completed->fetchColumn();

    $sql_pending = "SELECT COUNT(t.id) FROM tests t
                    JOIN enrollments e ON t.course_id = e.course_id
                    WHERE e.user_id = ? AND t.is_active = 1 AND t.id NOT IN (SELECT test_id FROM test_attempts WHERE user_id = ?)";
    $stmt_pending = $pdo->prepare($sql_pending);
    $stmt_pending->execute([$user_id, $user_id]);
    $stats['pending_tests'] = $stmt_pending->fetchColumn();

    $stmt_avg = $pdo->prepare("SELECT AVG(percentage) FROM results WHERE user_id = ?");
    $stmt_avg->execute([$user_id]);
    $stats['avg_score'] = round($stmt_avg->fetchColumn() ?: 0, 2);

    json_response(true, "Dashboard data loaded.", $stats);
}

function get_available_courses($pdo) {
    $courses = $pdo->query("SELECT * FROM courses ORDER BY course_name")->fetchAll(PDO::FETCH_ASSOC);
    json_response(true, "Courses loaded.", $courses);
}

function enroll_in_course($pdo, $user_id) {
    $data = json_decode(file_get_contents('php://input'), true);
    $course_id = $data['course_id'] ?? null;

    if (!$course_id) {
        json_response(false, "Course ID is required.");
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)");
        $stmt->execute([$user_id, $course_id]);
        json_response(true, "Enrolled successfully!");
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Catch duplicate entry
            json_response(false, "You are already enrolled in this course.");
        }
        json_response(false, "An error occurred during enrollment.");
    }
}

function get_available_tests($pdo, $user_id) {
    $sql = "SELECT t.* FROM tests t
            JOIN enrollments e ON t.course_id = e.course_id
            WHERE e.user_id = ?
              AND t.is_active = 1
              AND t.available_from <= NOW() AND t.available_until >= NOW()
              AND NOT EXISTS (SELECT 1 FROM test_attempts ta WHERE ta.test_id = t.id AND ta.user_id = ?)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id, $user_id]);
    $tests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response(true, "Available tests loaded.", $tests);
}

?>
