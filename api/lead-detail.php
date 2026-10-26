<?php
/**
 * ============================================================================
 * ADMIN LEAD DETAIL & INTERACTION TIMELINE API
 * Endpoint: GET /api/lead-detail.php?id=123 (or session_id=SM-...)
 * ============================================================================
 */

require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/config/auth.php';

requireAdminAuth(true);

$id = (int)($_GET['id'] ?? 0);
$sessionId = trim($_GET['session_id'] ?? '');

if ($id <= 0 && empty($sessionId)) {
    sendJson(400, ['success' => false, 'message' => 'Lead ID or session_id is required.']);
}

try {
    $pdo = getAdminDB();

    if ($id > 0) {
        $stmt = $pdo->prepare("SELECT * FROM leads WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM leads WHERE session_id = ? LIMIT 1");
        $stmt->execute([$sessionId]);
    }
    $lead = $stmt->fetch();

    if (!$lead) {
        sendJson(404, ['success' => false, 'message' => 'Lead not found.']);
    }

    // Retrieve interaction click history
    $intStmt = $pdo->prepare("
        SELECT id, step_number, question, selected_answer, field_name, action_type, ip_address, created_at
        FROM assessment_interactions
        WHERE session_id = ?
        ORDER BY id ASC
    ");
    $intStmt->execute([$lead['session_id']]);
    $interactions = $intStmt->fetchAll();

    sendJson(200, [
        'success' => true,
        'lead' => $lead,
        'interactions' => $interactions
    ]);

} catch (Exception $e) {
    error_log("[Lead Detail Error] " . $e->getMessage());
    sendJson(500, ['success' => false, 'message' => 'Failed to fetch lead details: ' . $e->getMessage()]);
}
