<?php
/**
 * ============================================================================
 * ADMIN LOGOUT API
 * Endpoint: POST or GET /api/logout.php
 * ============================================================================
 */

require_once dirname(__DIR__) . '/config/auth.php';

logoutAdminSession();

sendJson(200, [
    'success' => true,
    'message' => 'Logged out successfully.',
    'redirect' => '/login.html'
]);
