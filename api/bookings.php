<?php
/**
 * Bookings API
 *
 * POST   /api/bookings.php           — public: submit a booking (multipart with screenshot)
 * GET    /api/bookings.php           — admin: list all bookings
 * GET    /api/bookings.php?id=N      — admin: get single booking
 * PUT    /api/bookings.php           — admin: update status / notes
 * DELETE /api/bookings.php?id=N      — admin: delete booking
 */
require_once __DIR__ . '/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$db     = get_db();

// ── PUBLIC: Submit Booking ───────────────────────────────────
if ($method === 'POST') {

    // Validate required fields from form POST or JSON
    $data = !empty($_POST) ? $_POST : get_body();

    $required = ['service', 'type', 'date', 'time', 'name', 'email', 'phone', 'payment'];
    foreach ($required as $field) {
        if (empty(trim($data[$field] ?? ''))) {
            json_error("Field '{$field}' is required.");
        }
    }

    // Time validation 09:00 – 23:00
    $time = $data['time'];
    $hour = (int)explode(':', $time)[0];
    if ($hour < 9 || $hour > 23) {
        json_error('Booking time must be between 9:00 AM and 11:00 PM.');
    }

    // Date: must be today or future
    if (strtotime($data['date']) < strtotime(date('Y-m-d'))) {
        json_error('Booking date must be today or in the future.');
    }

    // Price lookup
    $svc   = $db->prepare('SELECT price FROM services WHERE name = ? AND active = 1');
    $svc->execute([trim($data['service'])]);
    $svcRow = $svc->fetch();
    $base   = $svcRow ? (float)$svcRow['price'] : 0;
    $extra  = $data['type'] === 'incall' ? 50 : 0;
    $total  = $base + $extra;

    // Screenshot upload
    $screenshotPath = null;
    if (!empty($_FILES['screenshot']['tmp_name'])) {
        $file = $_FILES['screenshot'];
        $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowed)) json_error('Invalid screenshot format. Use JPG, PNG, or WebP.');
        if ($file['size'] > 5 * 1024 * 1024) json_error('Screenshot must be under 5 MB.');
        $ext  = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('pay_', true) . '.' . $ext;
        $uploadDir = __DIR__ . '/uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        move_uploaded_file($file['tmp_name'], $uploadDir . $filename);
        $screenshotPath = $filename;
    }

    $stmt = $db->prepare('
        INSERT INTO bookings
            (service, type, address, date, time, name, height, email, phone, payment, screenshot, total, deposit, status)
        VALUES
            (:service, :type, :address, :date, :time, :name, :height, :email, :phone, :payment, :screenshot, :total, 100, "pending")
    ');
    $stmt->execute([
        ':service'    => trim($data['service']),
        ':type'       => $data['type'],
        ':address'    => trim($data['address'] ?? ''),
        ':date'       => $data['date'],
        ':time'       => $data['time'],
        ':name'       => trim($data['name']),
        ':height'     => trim($data['height'] ?? ''),
        ':email'      => trim($data['email']),
        ':phone'      => trim($data['phone']),
        ':payment'    => trim($data['payment']),
        ':screenshot' => $screenshotPath,
        ':total'      => $total,
    ]);

    json_ok([
        'id'      => $db->lastInsertId(),
        'message' => 'Booking received! We will confirm once payment is verified.',
        'total'   => $total,
        'deposit' => 100,
    ], 201);
}

// ── ADMIN ONLY below ─────────────────────────────────────────
require_auth();

if ($method === 'GET') {
    if (!empty($_GET['id'])) {
        $stmt = $db->prepare('SELECT * FROM bookings WHERE id = ?');
        $stmt->execute([(int)$_GET['id']]);
        $row = $stmt->fetch();
        if (!$row) json_error('Booking not found', 404);
        json_ok($row);
    }

    // Filters
    $status = $_GET['status'] ?? '';
    $search = $_GET['search'] ?? '';
    $sql    = 'SELECT * FROM bookings WHERE 1=1';
    $params = [];

    if ($status) {
        $sql .= ' AND status = ?';
        $params[] = $status;
    }
    if ($search) {
        $sql .= ' AND (name LIKE ? OR email LIKE ? OR service LIKE ?)';
        $like = "%{$search}%";
        $params = array_merge($params, [$like, $like, $like]);
    }
    $sql .= ' ORDER BY created_at DESC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    json_ok($stmt->fetchAll());
}

if ($method === 'PUT') {
    $body = get_body();
    $id   = (int)($body['id'] ?? 0);
    if (!$id) json_error('ID required');

    $allowed = ['status', 'notes'];
    $sets = [];
    $vals = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $body)) {
            $sets[] = "{$field} = ?";
            $vals[] = $body[$field];
        }
    }
    if (empty($sets)) json_error('Nothing to update');
    $vals[] = $id;

    $db->prepare('UPDATE bookings SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);

    // If status was changed to confirmed, send email
    if (isset($body['status']) && $body['status'] === 'confirmed') {
        // Fetch booking details for the email
        $stmt = $db->prepare('SELECT * FROM bookings WHERE id = ?');
        $stmt->execute([$id]);
        $booking = $stmt->fetch();

        if ($booking) {
            $bookingCode = 'SHL-' . str_pad($id, 4, '0', STR_PAD_LEFT);
            $to = $booking['email'];
            $subject = 'Your Booking is Confirmed - Shelley Wellness';
            
            $message = "Hello {$booking['name']},\n\n";
            $message .= "Your payment has been received and your booking is officially confirmed!\n\n";
            $message .= "Booking Details:\n";
            $message .= "--------------------------------------\n";
            $message .= "Booking Code: {$bookingCode}\n";
            $message .= "Service: {$booking['service']}\n";
            $message .= "Date: {$booking['date']}\n";
            $message .= "Time: {$booking['time']}\n";
            if ($booking['type'] === 'outcall') {
                $message .= "Location: Outcall (Address will be provided shortly)\n";
            } else {
                $message .= "Location: Incall (Your address: {$booking['address']})\n";
            }
            $message .= "--------------------------------------\n\n";
            $message .= "We look forward to your session.\n\nWarm regards,\nShelley Wellness Massage";

            // Get site email for 'From' header
            $siteEmail = $db->query("SELECT value FROM settings WHERE key = 'contact_email'")->fetchColumn() ?: 'noreply@shelleywellnessmassages.org';
            
            $headers = "From: Shelley Wellness <{$siteEmail}>\r\n";
            $headers .= "Reply-To: {$siteEmail}\r\n";

            // Send email (requires mail server configuration in php.ini)
            @mail($to, $subject, $message, $headers);
        }
    }

    json_ok(['updated' => $id]);
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_error('ID required');
    $db->prepare('DELETE FROM bookings WHERE id = ?')->execute([$id]);
    json_ok(['deleted' => $id]);
}

json_error('Method not allowed', 405);
