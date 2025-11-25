<?php
// --- Simple Installation Script for PharmaSuccess ---

error_reporting(E_ALL);
ini_set('display_errors', 1);

// The db.php file is now inside the 'backend' directory
require_once 'backend/db.php';

// --- Safety Check ---
// Check if the 'users' table already exists. If it does, abort the script.
try {
    $pdo->query("SELECT 1 FROM users LIMIT 1");
    die("<strong>Installation Aborted:</strong> It looks like the database tables already exist. Please manually drop the tables if you wish to run a fresh installation. This is a safety measure to prevent accidental data loss.");
} catch (PDOException $e) {
    // Table doesn't exist, which is what we want. We can proceed.
}

try {
    // --- Create users Table ---
    $sql_users = "
    CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        user_type ENUM('student', 'admin') DEFAULT 'student',
        status ENUM('pending', 'active', 'inactive', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );";
    $pdo->exec($sql_users);
    echo "Table 'users' created successfully.<br>";

    // ... (rest of the installation script remains the same)

        // --- Create courses Table ---
    $sql_courses = "
    CREATE TABLE courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_name VARCHAR(255) NOT NULL,
        description TEXT,
        duration_months INT
    );";
    $pdo->exec($sql_courses);
    echo "Table 'courses' created successfully.<br>";

    // --- Create enrollments Table (Junction Table) ---
    $sql_enrollments = "
    CREATE TABLE enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        course_id INT NOT NULL,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE KEY (user_id, course_id)
    );";
    $pdo->exec($sql_enrollments);
    echo "Table 'enrollments' created successfully.<br>";

    // --- Create tests Table ---
    $sql_tests = "
    CREATE TABLE tests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        test_title VARCHAR(255) NOT NULL,
        course_id INT NOT NULL,
        duration_minutes INT NOT NULL,
        total_marks INT NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        test_type VARCHAR(50),
        available_from DATETIME,
        available_until DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );";
    $pdo->exec($sql_tests);
    echo "Table 'tests' created successfully.<br>";

    // --- Create questions Table ---
    $sql_questions = "
    CREATE TABLE questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        test_id INT NOT NULL,
        question_text TEXT NOT NULL,
        option_a VARCHAR(255) NOT NULL,
        option_b VARCHAR(255) NOT NULL,
        option_c VARCHAR(255) NOT NULL,
        option_d VARCHAR(255) NOT NULL,
        correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,
        explanation TEXT,
        marks INT NOT NULL,
        difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    );";
    $pdo->exec($sql_questions);
    echo "Table 'questions' created successfully.<br>";

    // --- Create test_attempts Table ---
    $sql_attempts = "
    CREATE TABLE test_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        test_id INT NOT NULL,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP NULL,
        status ENUM('started', 'completed') DEFAULT 'started',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    );";
    $pdo->exec($sql_attempts);
    echo "Table 'test_attempts' created successfully.<br>";

    // --- Create answers Table ---
    $sql_answers = "
    CREATE TABLE answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attempt_id INT NOT NULL,
        question_id INT NOT NULL,
        selected_option ENUM('A', 'B', 'C', 'D'),
        is_correct TINYINT(1),
        FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );";
    $pdo->exec($sql_answers);
    echo "Table 'answers' created successfully.<br>";

    // --- Create results Table ---
    $sql_results = "
    CREATE TABLE results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attempt_id INT NOT NULL,
        user_id INT NOT NULL,
        test_id INT NOT NULL,
        marks_obtained INT NOT NULL,
        total_marks INT NOT NULL,
        percentage DECIMAL(5, 2) NOT NULL,
        status ENUM('pass', 'fail') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    );";
    $pdo->exec($sql_results);
    echo "Table 'results' created successfully.<br>";

    // --- Insert Sample Data ---

    // Hash a default password
    $default_password = password_hash('password123', PASSWORD_DEFAULT);

    // Users
    $pdo->exec("
    INSERT INTO users (full_name, email, password_hash, user_type, status) VALUES
    ('Admin User', 'admin@pharma.com', '$default_password', 'admin', 'active'),
    ('Rahul Sharma', 'student@pharma.com', '$default_password', 'student', 'active'),
    ('New Student', 'pending@pharma.com', '$default_password', 'student', 'pending');
    ");
    echo "Inserted sample users.<br>";

    // Courses
    $pdo->exec("
    INSERT INTO courses (id, course_name, description, duration_months) VALUES
    (1, 'GPAT 2026 Comprehensive', 'Complete syllabus coverage for GPAT 2026.', 12),
    (2, 'MPSC Drug Inspector', 'Specialized batch for Drug Inspector exams.', 6);
    ");
    echo "Inserted sample courses.<br>";

    // Tests
    $pdo->exec("
    INSERT INTO tests (id, test_title, course_id, duration_minutes, total_marks, test_type, available_from, available_until) VALUES
    (101, 'GPAT 2026 Mock Test 1', 1, 60, 20, 'Mock', '2024-01-01 00:00:00', '2025-12-31 23:59:59'),
    (102, 'Pharmacology: CNS Drugs', 1, 30, 20, 'Unit', '2024-01-01 00:00:00', '2025-12-31 23:59:59');
    ");
    echo "Inserted sample tests.<br>";

    // Questions for Test 101
    $pdo->exec("
    INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks) VALUES
    (101, 'What is the mechanism of action of Aspirin?', 'Irreversible COX-1 Inhibition', 'Beta Blocker', 'Calcium Channel Blocker', 'Reversible COX-2 Inhibition', 'A', 4),
    (101, 'Which of the following is an antimalarial drug?', 'Paracetamol', 'Chloroquine', 'Metformin', 'Amlodipine', 'B', 4),
    (101, 'The half-life of Digoxin is approximately:', '36-48 hours', '2-4 hours', '10-12 hours', '100 hours', 'A', 4),
    (101, 'Schedule H of the Drugs and Cosmetics Act refers to:', 'List of dyes', 'Prescription drugs', 'Biological products', 'Life period of drugs', 'B', 4),
    (101, 'Which vitamin is known as Riboflavin?', 'Vitamin B1', 'Vitamin B2', 'Vitamin B6', 'Vitamin B12', 'B', 4);
    ");
    echo "Inserted sample questions.<br>";


    echo "<hr><strong>Installation complete!</strong><br>";
    echo "You can now login with:<br>";
    echo "Admin: admin@pharma.com / password123<br>";
    echo "Student: student@pharma.com / password123<br>";
    echo "<strong>IMPORTANT: Please delete this 'install.php' file now.</strong>";

} catch (PDOException $e) {
    die("DB ERROR: ". $e->getMessage());
}
?>
