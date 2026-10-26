<?php
/**
 * ============================================================================
 * ADMIN PORTAL — AUTHENTICATION & SESSION MANAGEMENT
 * ============================================================================
 */

function startAdminSession() {
    if (session_status() === PHP_SESSION_NONE) {
        // Secure session cookie settings
        session_name('ALPHA_ADMIN_SESS');
        session_set_cookie_params([
            'lifetime' => 86400 * 7, // 7 days
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        session_start();
    }
}

function isAdminLoggedIn() {
    startAdminSession();
    return !empty($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

function getLoggedInAdmin() {
    startAdminSession();
    if (!isAdminLoggedIn()) {
        return null;
    }
    return [
        'username' => $_SESSION['admin_user'] ?? 'admin',
        'role' => $_SESSION['admin_role'] ?? 'Administrator'
    ];
}

function requireAdminAuth($isApi = true) {
    if (!isAdminLoggedIn()) {
        if ($isApi) {
            header('Content-Type: application/json; charset=UTF-8');
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Unauthorized. Please log in to access admin resources.',
                'redirect' => '/login.html'
            ]);
            exit;
        } else {
            header('Location: /login.html');
            exit;
        }
    }
}

function loginAdminSession($username, $role = 'Administrator') {
    startAdminSession();
    session_regenerate_id(true);
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['admin_user'] = $username;
    $_SESSION['admin_role'] = $role;
    $_SESSION['login_time'] = time();
}

function logoutAdminSession() {
    startAdminSession();
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
}

function sendJson($statusCode, array $data) {
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=UTF-8');
        header('X-Content-Type-Options: nosniff');
        http_response_code($statusCode);
    }
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
