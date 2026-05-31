<?php
/*
 * File: api/search.php
 * Purpose: Search and filter shipments via GET parameters, return JSON results
 */

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(400);
    echo json_encode(['error' => 'Only GET requests are allowed.']);
    exit;
}

require_once __DIR__ . '/../server/includes/db.php';

$q          = trim($_GET['q'] ?? '');
$carrier    = trim($_GET['carrier'] ?? '');
$status     = trim($_GET['status'] ?? '');
$category   = trim($_GET['category'] ?? '');
$dateFrom   = trim($_GET['date_from'] ?? '');
$dateTo     = trim($_GET['date_to'] ?? '');

$allowedCarriers   = ['aramex', 'dhl', 'fedex', 'smsa'];
$allowedStatuses   = ['created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
$allowedCategories = ['standard', 'express', 'freight'];

$sql    = 'SELECT id, tracking_number, carrier, origin_city, destination_city,
                  status, category, weight_kg, estimated_delivery, last_updated, created_at
           FROM shipments WHERE 1=1';
$params = [];
$types  = '';

if ($q !== '') {
    $sql .= ' AND (tracking_number LIKE ? OR origin_city LIKE ? OR destination_city LIKE ?)';
    $like = '%' . $q . '%';
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $types .= 'sss';
}

if ($carrier !== '' && in_array($carrier, $allowedCarriers, true)) {
    $sql .= ' AND carrier = ?';
    $params[] = $carrier;
    $types .= 's';
}

if ($status !== '' && in_array($status, $allowedStatuses, true)) {
    $sql .= ' AND status = ?';
    $params[] = $status;
    $types .= 's';
}

if ($category !== '' && in_array($category, $allowedCategories, true)) {
    $sql .= ' AND category = ?';
    $params[] = $category;
    $types .= 's';
}

if ($dateFrom !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
    $sql .= ' AND estimated_delivery >= ?';
    $params[] = $dateFrom;
    $types .= 's';
}

if ($dateTo !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
    $sql .= ' AND estimated_delivery <= ?';
    $params[] = $dateTo;
    $types .= 's';
}

$sql .= ' ORDER BY last_updated DESC';

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Query preparation failed.']);
    exit;
}

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$shipments = [];
while ($row = $result->fetch_assoc()) {
    $shipments[] = $row;
}

echo json_encode($shipments);

$stmt->close();
$conn->close();
