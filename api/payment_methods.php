<?php
/**
 * Payment Methods API
 *
 * GET    /api/payment_methods.php      — public: list active payment methods
 * POST   /api/payment_methods.php      — admin: create payment method
 * PUT    /api/payment_methods.php      — admin: update payment method
 * DELETE /api/payment_methods.php?id=N — admin: delete payment method
 */
require_once __DIR__ . '/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = get_db();

if ($method === 'GET') {
    $adminMode = !empty($_GET['admin']);
    if ($adminMode) require_auth();
    $sql = $adminMode
        ? 'SELECT * FROM payment_methods'
        : 'SELECT * FROM payment_methods WHERE active = 1';
    json_ok($db->query($sql)->fetchAll());
}

require_auth();

if ($method === 'POST') {
    $body = get_body();
    if (empty(trim($body['name'] ?? ''))) json_error("Field 'name' is required.");

    $stmt = $db->prepare('
        INSERT INTO payment_methods (name, details, bank_name, account_name, account_number, routing_number, swift_code, active)
        VALUES (:name, :details, :bank_name, :account_name, :account_number, :routing_number, :swift_code, 1)
    ');
    $stmt->execute([
        ':name'           => trim($body['name']),
        ':details'        => trim($body['details'] ?? ''),
        ':bank_name'      => trim($body['bank_name'] ?? ''),
        ':account_name'   => trim($body['account_name'] ?? ''),
        ':account_number' => trim($body['account_number'] ?? ''),
        ':routing_number' => trim($body['routing_number'] ?? ''),
        ':swift_code'     => trim($body['swift_code'] ?? ''),
    ]);
    json_ok(['id' => $db->lastInsertId()], 201);
}

if ($method === 'PUT') {
    $body = get_body();
    $id   = (int)($body['id'] ?? 0);
    if (!$id) json_error('ID required');

    $fields = ['name', 'details', 'bank_name', 'account_name', 'account_number', 'routing_number', 'swift_code', 'active'];
    $sets = [];
    $vals = [];
    foreach ($fields as $f) {
        if (array_key_exists($f, $body)) {
            $sets[] = "{$f} = ?";
            $vals[] = $body[$f];
        }
    }
    if (empty($sets)) json_error('Nothing to update');
    $vals[] = $id;
    $db->prepare('UPDATE payment_methods SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
    json_ok(['updated' => $id]);
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_error('ID required');
    $db->prepare('DELETE FROM payment_methods WHERE id = ?')->execute([$id]);
    json_ok(['deleted' => $id]);
}

json_error('Method not allowed', 405);
