<?php
/**
 * POST /api/auth.php
 * Body: { "password": "..." }
 * Returns: { "token": "..." }
 */
require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed', 405);

$body = get_body();
$password = trim($body['password'] ?? '');

if ($password === '') json_error('Password required');

$db   = get_db();
$hash = $db->query("SELECT value FROM settings WHERE key = 'admin_password'")->fetchColumn();

if (!$hash || !password_verify($password, $hash)) {
    json_error('Invalid password', 401);
}

json_ok(['token' => make_token('admin')]);
