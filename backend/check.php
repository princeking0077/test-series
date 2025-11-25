<?php
// --- Server and Application Diagnostic Tool ---

// Set a clear content type
header('Content-Type: text/html; charset=utf--8');

// --- Helper Functions ---

/**
 * Renders a single check result row with a label, status, and optional notes.
 */
function render_check($label, $status, $notes = '') {
    $status_html = $status
        ? '<span style="color: #28a745; font-weight: bold;">PASS</span>'
        : '<span style="color: #dc3545; font-weight: bold;">FAIL</span>';

    echo '<div style="padding: 8px; border-bottom: 1px solid #eee;">';
    echo '<div style="display: flex; justify-content: space-between; align-items: center;">';
    echo '<span>' . htmlspecialchars($label) . '</span>';
    echo '<span>' . $status_html . '</span>';
    echo '</div>';
    if ($notes) {
        echo '<div style="font-size: 0.9em; color: #666; margin-top: 4px;">' . htmlspecialchars($notes) . '</div>';
    }
    echo '</div>';
}

// --- Run Checks ---

// 1. PHP Version Check
$php_version = phpversion();
$is_php_ok = version_compare($php_version, '7.4', '>=');
render_check(
    'PHP Version Check',
    $is_php_ok,
    $is_php_ok ? "Version {$php_version} is sufficient." : "Version {$php_version} is too old. Hostinger should support PHP 7.4 or newer. Please update it in your hPanel."
);

// 2. Required PHP Extensions Check
$is_pdo_ok = extension_loaded('PDO');
render_check('PDO Extension Loaded', $is_pdo_ok, $is_pdo_ok ? 'PDO is available.' : 'The PDO extension is missing. This is a standard PHP extension and should be enabled.');

$is_pdo_mysql_ok = extension_loaded('pdo_mysql');
render_check('PDO MySQL Driver Loaded', $is_pdo_mysql_ok, $is_pdo_mysql_ok ? 'MySQL driver for PDO is available.' : 'The PDO MySQL driver is missing. This is required to connect to your database.');

// 3. Configuration File Check
$config_path = __DIR__ . '/config.php';
$is_config_ok = file_exists($config_path);
render_check(
    'Configuration File Exists',
    $is_config_ok,
    $is_config_ok ? '`backend/config.php` was found.' : 'The `backend/config.php` file is missing. Please ensure you have uploaded it correctly.'
);

// 4. Database Connection Check
$db_error = '';
if ($is_config_ok) {
    // Include the config file to get credentials
    require_once $config_path;
    try {
        // Attempt connection
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $is_db_ok = true;
    } catch (PDOException $e) {
        $is_db_ok = false;
        // Provide a safe error message
        $db_error = 'Connection failed: ' . $e->getMessage();
    }
} else {
    $is_db_ok = false;
    $db_error = 'Skipped because config.php is missing.';
}
render_check(
    'Database Connection',
    $is_db_ok,
    $is_db_ok ? 'Successfully connected to the database `' . DB_NAME . '`.' : $db_error
);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Health Check</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; background-color: #f8f9fa; }
        .container { max-width: 800px; margin: 40px auto; background: #fff; border: 1px solid #dee2e6; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { padding: 20px; background-color: #007bff; color: white; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .summary { padding: 20px; border-top: 1px solid #eee; text-align: center; font-size: 1.1em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Application Health Check</h1>
        </div>
        <div class="content">
            <?php // The PHP code above has already rendered the checks here ?>
        </div>
        <div class="summary">
            <?php if ($is_php_ok && $is_pdo_ok && $is_pdo_mysql_ok && $is_config_ok && $is_db_ok): ?>
                <strong style="color: #28a745;">All checks passed!</strong> Your server environment appears to be correctly configured.
            <?php else: ?>
                <strong style="color: #dc3545;">One or more checks failed.</strong> Please review the errors above.
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
