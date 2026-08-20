<?php
/**
 * Shared helpers — CORS, response helpers, auth
 */
require_once __DIR__ . '/database.php';

// ── CORS ────────────────────────────────────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── RESPONSE HELPERS ────────────────────────────────────────
function json_ok(mixed $data, int $code = 200): never {
    http_response_code($code);
    echo json_encode(['success' => true, 'data' => $data]);
    exit;
}

function json_error(string $message, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

function get_body(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

// ── AUTH ────────────────────────────────────────────────────
function require_auth(): void {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($auth, 'Bearer ')) {
        json_error('Unauthorized', 401);
    }
    $token = substr($auth, 7);
    // Simple signed token: base64(admin_id:timestamp:hash)
    $parts = explode(':', base64_decode($token));
    if (count($parts) !== 3) json_error('Unauthorized', 401);
    [$uid, $ts, $hash] = $parts;
    // Token valid for 8 hours
    if (time() - (int)$ts > 28800) json_error('Token expired', 401);
    $expected = hash_hmac('sha256', $uid . ':' . $ts, get_token_secret());
    if (!hash_equals($expected, $hash)) json_error('Unauthorized', 401);
}

function make_token(string $uid): string {
    $ts   = time();
    $hash = hash_hmac('sha256', $uid . ':' . $ts, get_token_secret());
    return base64_encode($uid . ':' . $ts . ':' . $hash);
}

function get_token_secret(): string {
    $secretFile = __DIR__ . '/../db/.secret';
    if (!file_exists($secretFile)) {
        file_put_contents($secretFile, bin2hex(random_bytes(32)));
    }
    return trim(file_get_contents($secretFile));
}
