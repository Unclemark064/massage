<?php
/**
 * Settings API
 *
 * GET  /api/settings.php            — admin: get all settings
 * PUT  /api/settings.php            — admin: update settings
 */
require_once __DIR__ . '/helpers.php';

require_auth();

$method = $_SERVER['REQUEST_METHOD'];
$db     = get_db();

if ($method === 'GET') {
    $rows = $db->query("SELECT key, value FROM settings WHERE key != 'admin_password'")->fetchAll();
    $settings = [];
    foreach ($rows as $row) $settings[$row['key']] = $row['value'];
    json_ok($settings);
}

if ($method === 'PUT') {
    $body = get_body();
    $stmt = $db->prepare("INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value");

    // Handle password change separately
    if (!empty($body['new_password'])) {
        $stmt->execute(['admin_password', password_hash($body['new_password'], PASSWORD_BCRYPT)]);
        unset($body['new_password']);
    }

    $allowed = ['site_name', 'contact_email', 'deposit', 'incall_fee'];
    foreach ($allowed as $key) {
        if (array_key_exists($key, $body)) {
            $stmt->execute([$key, $body[$key]]);
        }
    }
    json_ok(['message' => 'Settings updated']);
}

json_error('Method not allowed', 405);
