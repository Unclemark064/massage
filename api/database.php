<?php
/**
 * Database connection & initialization
 * Uses SQLite — no MySQL installation needed
 */
define('DB_PATH', __DIR__ . '/../db/shelley.db');

function get_db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('sqlite:' . DB_PATH);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->exec('PRAGMA journal_mode=WAL;');
        init_db($pdo);
    }
    return $pdo;
}

function init_db(PDO $pdo): void {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS bookings (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            service     TEXT NOT NULL,
            type        TEXT NOT NULL DEFAULT 'outcall',
            address     TEXT,
            date        TEXT NOT NULL,
            time        TEXT NOT NULL,
            name        TEXT NOT NULL,
            height      TEXT,
            email       TEXT NOT NULL,
            phone       TEXT NOT NULL,
            payment     TEXT NOT NULL,
            screenshot  TEXT,
            status      TEXT NOT NULL DEFAULT 'pending',
            total       REAL DEFAULT 0,
            deposit     REAL DEFAULT 100,
            notes       TEXT,
            created_at  TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS services (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            description TEXT,
            price       REAL NOT NULL,
            duration    INTEGER DEFAULT 60,
            active      INTEGER DEFAULT 1,
            image       TEXT,
            sort_order  INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS settings (
            key         TEXT PRIMARY KEY,
            value       TEXT
        );

        CREATE TABLE IF NOT EXISTS payment_methods (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            name            TEXT NOT NULL,
            details         TEXT,
            bank_name       TEXT,
            account_name    TEXT,
            account_number  TEXT,
            routing_number  TEXT,
            swift_code      TEXT,
            active          INTEGER DEFAULT 1
        );
    ");

    // Seed services if empty
    $count = $pdo->query('SELECT COUNT(*) FROM services')->fetchColumn();
    if ($count == 0) {
        $services = [
            ['Energy Clearing Session', 'A balancing session designed to restore calm clarity, and energetic alignment.', 200.00, 60, 'service_energy.jpg'],
            ['Nuru Massage (Special)', 'A deeply relaxing, full-body gliding massage using premium Nuru gel.', 250.00, 60, ''],
            ['Couples Massage (Special)', 'A synchronized relaxation experience for partners.', 350.00, 60, ''],
            ['Aromatherapy Massage', 'A soothing massage enhanced with essential oils.', 200.00, 60, ''],
            ['Swedish Massage', 'A classic relaxation massage using long, flowing strokes.', 200.00, 60, 'service_swedish.jpg'],
            ['Deep Tissue Massage', 'A therapeutic, firm-pressure massage targeting chronic muscle tension.', 200.00, 60, 'service_deep.jpg'],
            ['Keratin Permanent Hair Straightener', 'A smoothing, long-lasting treatment for sleek hair.', 200.00, 60, ''],
            ['Oasis Aloe Body Wrap', 'A hydrating full-body wrap using cooling aloe.', 150.00, 60, ''],
            ['Ashiatsu Massage', 'A unique, barefoot massage technique delivering deep broad pressure.', 150.00, 60, ''],
        ];
        $stmt = $pdo->prepare('INSERT INTO services (name, description, price, duration, image, sort_order) VALUES (?,?,?,?,?,?)');
        foreach ($services as $i => $s) {
            $stmt->execute([$s[0], $s[1], $s[2], $s[3], $s[4], $i]);
        }
    }

    // Seed payment methods if empty
    $pmCount = $pdo->query('SELECT COUNT(*) FROM payment_methods')->fetchColumn();
    if ($pmCount == 0) {
        $methods = [
            ['Chime', '$DiscountKickzzz', '', '', '', '', ''],
            ['Bitcoin', '1DG9P4ZsPhgLu6r6WkBPedyqsMjcR5NYGC', '', '', '', '', ''],
            ['Giftcard (Apple or Razer Gold)', 'shelleyamber05@gmail.com', '', '', '', '', ''],
            ['Bank Transfer', '', 'GO2 BANK', 'Marissa Wiltberger', '15212200396701', '124303162', ''],
        ];
        $stmt = $pdo->prepare('INSERT INTO payment_methods (name, details, bank_name, account_name, account_number, routing_number, swift_code) VALUES (?,?,?,?,?,?,?)');
        foreach ($methods as $m) {
            $stmt->execute($m);
        }
    }

    // Seed settings if empty
    $setCount = $pdo->query('SELECT COUNT(*) FROM settings')->fetchColumn();
    if ($setCount == 0) {
        $defaults = [
            ['site_name',    'Shelley Wellness Massage'],
            ['contact_email','shelleyamber05@gmail.com'],
            ['deposit',      '100'],
            ['incall_fee',   '50'],
            ['admin_password', password_hash('admin123', PASSWORD_BCRYPT)],
        ];
        $stmt = $pdo->prepare('INSERT INTO settings (key, value) VALUES (?,?)');
        foreach ($defaults as $d) {
            $stmt->execute($d);
        }
    }
}
