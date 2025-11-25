<?php
// --- Tests API ---

require_once '../db.php';
require_once '../auth_check.php';

require_auth(); // All actions require a logged-in user.
$user_id = get_session_user_id();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_test':
        get_test_details($pdo, $user_id);
        break;
    case 'submit_test':
        submit_test($pdo, $user_id);
        break;
    case 'get_results':
        get_student_results($pdo, $user_id);
        break;
    case 'bulk_import':
        require_admin(); // Only admins can import questions
        bulk_import_questions($pdo);
        break;
    default:
        json_response(false, "Invalid test action.");
}

// --- Function Definitions ---

function get_test_details($pdo, $user_id) {
    $test_id = $_GET['test_id'] ?? null;
    if (!$test_id) json_response(false, "Test ID is required.");

    // Fetch test details
    $stmt = $pdo->prepare("SELECT * FROM tests WHERE id = ? AND is_active = 1");
    $stmt->execute([$test_id]);
    $test = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$test) json_response(false, "Test not found or is not active.");

    // Fetch questions
    $stmt = $pdo->prepare("SELECT id, question_text, option_a, option_b, option_c, option_d, marks FROM questions WHERE test_id = ?");
    $stmt->execute([$test_id]);
    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Create a test attempt record
    $stmt = $pdo->prepare("INSERT INTO test_attempts (user_id, test_id) VALUES (?, ?)");
    $stmt->execute([$user_id, $test_id]);

    json_response(true, "Test loaded.", [
        'test' => $test,
        'questions' => $questions,
        'attempt_id' => $pdo->lastInsertId()
    ]);
}

function submit_test($pdo, $user_id) {
    $data = json_decode(file_get_contents('php://input'), true);
    $test_id = $data['test_id'] ?? null;
    $attempt_id = $data['attempt_id'] ?? null;
    $answers = $data['answers'] ?? [];

    if (!$test_id || !$attempt_id) json_response(false, "Test/Attempt ID is required.");

    // Get correct answers and marks for the test questions
    $stmt = $pdo->prepare("SELECT id, correct_option, marks FROM questions WHERE test_id = ?");
    $stmt->execute([$test_id]);
    $questions_data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Create lookup arrays for correct options and marks
    $correct_answers = array_column($questions_data, 'correct_option', 'id');
    $question_marks = array_column($questions_data, 'marks', 'id');

    $total_marks_obtained = 0;

    $pdo->beginTransaction();
    try {
        foreach ($answers as $answer) {
            $q_id = $answer['question_id'];
            $selected_option = $answer['selected_option'];

            // Ensure the question ID from the answer exists in our lookup to prevent errors
            if (isset($correct_answers[$q_id])) {
                $is_correct = ($correct_answers[$q_id] == $selected_option);
                if ($is_correct) {
                    $total_marks_obtained += $question_marks[$q_id];
                }

                $stmt_insert = $pdo->prepare("INSERT INTO answers (attempt_id, question_id, selected_option, is_correct) VALUES (?, ?, ?, ?)");
                $stmt_insert->execute([$attempt_id, $q_id, $selected_option, $is_correct]);
            }
        }

        $stmt_total = $pdo->prepare("SELECT total_marks FROM tests WHERE id = ?");
        $stmt_total->execute([$test_id]);
        $total_test_marks = $stmt_total->fetchColumn();

        $percentage = ($total_test_marks > 0) ? ($total_marks_obtained / $total_test_marks) * 100 : 0;

        $stmt_result = $pdo->prepare("INSERT INTO results (attempt_id, user_id, test_id, marks_obtained, total_marks, percentage, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt_result->execute([$attempt_id, $user_id, $test_id, $total_marks_obtained, $total_test_marks, $percentage, ($percentage >= 50 ? 'pass' : 'fail')]);

        $stmt_update = $pdo->prepare("UPDATE test_attempts SET status = 'completed', end_time = NOW() WHERE id = ?");
        $stmt_update->execute([$attempt_id]);

        $pdo->commit();
        json_response(true, "Test submitted successfully!");
    } catch (Exception $e) {
        $pdo->rollBack();
        json_response(false, "An error occurred: " . $e->getMessage());
    }
}

function get_student_results($pdo, $user_id) {
    $sql = "SELECT r.*, t.test_title FROM results r JOIN tests t ON r.test_id = t.id WHERE r.user_id = ? ORDER BY r.created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    json_response(true, "Results loaded.", $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function bulk_import_questions($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $test_id = $data['test_id'] ?? null;
    $questions = $data['questions'] ?? [];

    if (!$test_id || empty($questions)) json_response(false, "Test ID and questions are required.");

    $pdo->beginTransaction();
    $stmt = $pdo->prepare("INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    try {
        foreach ($questions as $q) {
            $stmt->execute([$test_id, $q['question_text'], $q['option_a'], $q['option_b'], $q['option_c'], $q['option_d'], $q['correct_option'], $q['marks'] ?? 4]);
        }
        $pdo->commit();
        json_response(true, "Successfully imported " . count($questions) . " questions.");
    } catch (Exception $e) {
        $pdo->rollBack();
        json_response(false, "Failed to import questions: " . $e->getMessage());
    }
}
?>
