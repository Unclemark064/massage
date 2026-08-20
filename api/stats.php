<?php
/**
 * Stats API  (admin dashboard overview)
 *
 * GET /api/stats.php
 * Returns: totals, revenue, recent bookings, status breakdown
 */
require_once __DIR__ . '/helpers.php';

require_auth();

$db = get_db();

$total     = $db->query('SELECT COUNT(*) FROM bookings')->fetchColumn();
$pending   = $db->query("SELECT COUNT(*) FROM bookings WHERE status = 'pending'")->fetchColumn();
$confirmed = $db->query("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'")->fetchColumn();
$cancelled = $db->query("SELECT COUNT(*) FROM bookings WHERE status = 'cancelled'")->fetchColumn();

$month     = date('Y-m');
$revenue   = $db->prepare("SELECT COALESCE(SUM(total),0) FROM bookings WHERE strftime('%Y-%m', created_at) = ? AND status = 'confirmed'");
$revenue->execute([$month]);
$monthRev  = (float)$revenue->fetchColumn();

$totalRev  = (float)$db->query("SELECT COALESCE(SUM(total),0) FROM bookings WHERE status = 'confirmed'")->fetchColumn();

$recent = $db->query("SELECT id, name, service, date, time, status, total FROM bookings ORDER BY created_at DESC LIMIT 5")->fetchAll();

json_ok([
    'bookings'   => ['total' => $total, 'pending' => $pending, 'confirmed' => $confirmed, 'cancelled' => $cancelled],
    'revenue'    => ['this_month' => $monthRev, 'all_time' => $totalRev],
    'recent'     => $recent,
]);
