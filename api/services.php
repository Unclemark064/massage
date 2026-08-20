<?php
/**
 * Services API
 *
 * GET    /api/services.php           — public: list active services
 * POST   /api/services.php           — admin: create service
 * PUT    /api/services.php           — admin: update service
 * DELETE /api/services.php?id=N      — admin: delete service
 */
require_once __DIR__ . '/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = get_db();

if ($method === 'GET') {
    $adminMode = !empty($_GET['admin']);
    if ($adminMode) require_auth();
    $sql = $adminMode
        ? 'SELECT * FROM services ORDER BY sort_order ASC'
        : 'SELECT * FROM services WHERE active = 1 ORDER BY sort_order ASC';
    json_ok($db->query($sql)->fetchAll());
}

require_auth();

if ($method === 'POST') {
    $body = get_body();
    $required = ['name', 'price'];
    foreach ($required as $f) {
        if (empty(trim($body[$f] ?? ''))) json_error("Field '{$f}' is required.");
    }

    $stmt = $db->prepare('
        INSERT INTO services (name, description, price, duration, image, active, sort_order)
        VALUES (:name, :desc, :price, :dur, :img, 1,
            (SELECT COALESCE(MAX(sort_order),0)+1 FROM services))
    ');
    $stmt->execute([
        ':name'  => trim($body['name']),
        ':desc'  => trim($body['description'] ?? ''),
        ':price' => (float)$body['price'],
        ':dur'   => (int)($body['duration'] ?? 60),
        ':img'   => trim($body['image'] ?? ''),
    ]);
    json_ok(['id' => $db->lastInsertId()], 201);
}

if ($method === 'PUT') {
    $body = get_body();
    $id   = (int)($body['id'] ?? 0);
    if (!$id) json_error('ID required');

    $fields = ['name', 'description', 'price', 'duration', 'image', 'active', 'sort_order'];
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
    $db->prepare('UPDATE services SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
    json_ok(['updated' => $id]);
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_error('ID required');
    $db->prepare('DELETE FROM services WHERE id = ?')->execute([$id]);
    json_ok(['deleted' => $id]);
}

json_error('Method not allowed', 405);
