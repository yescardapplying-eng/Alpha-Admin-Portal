<?php
/**
 * ============================================================================
 * ADMIN PORTAL — BUILT-IN PHP SERVER ROUTER
 * Run: php -S localhost:8080 router.php
 * ============================================================================
 */

require_once __DIR__ . '/config/auth.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = urldecode($uri);

// API Routes Map
$apiRoutes = [
    '/api/login'       => __DIR__ . '/api/login.php',
    '/api/login.php'   => __DIR__ . '/api/login.php',
    '/api/logout'      => __DIR__ . '/api/logout.php',
    '/api/logout.php'  => __DIR__ . '/api/logout.php',
    '/api/leads'       => __DIR__ . '/api/leads.php',
    '/api/leads.php'   => __DIR__ . '/api/leads.php',
    '/api/lead-detail' => __DIR__ . '/api/lead-detail.php',
    '/api/lead-detail.php' => __DIR__ . '/api/lead-detail.php',
    '/api/delete-lead' => __DIR__ . '/api/delete-lead.php',
    '/api/delete-lead.php' => __DIR__ . '/api/delete-lead.php',
    '/api/export-csv'  => __DIR__ . '/api/export-csv.php',
    '/api/export-csv.php'  => __DIR__ . '/api/export-csv.php',
];

if (isset($apiRoutes[$uri])) {
    require $apiRoutes[$uri];
    exit;
}

// Block access to private/internal files
$blocked = [
    '/^\/\./',
    '/^\/config(\/|$)/i',
    '/^\/database(\/|$)/i',
    '/^\/cacert\.pem$/i'
];

foreach ($blocked as $pattern) {
    if (preg_match($pattern, $uri)) {
        http_response_code(403);
        echo "403 Forbidden";
        exit;
    }
}

// Root access protection
if ($uri === '/' || $uri === '' || $uri === '/index.html') {
    if (!isAdminLoggedIn()) {
        header('Location: /login.html');
        exit;
    }
    $uri = '/index.html';
}

$filePath = __DIR__ . $uri;

if (file_exists($filePath) && !is_dir($filePath)) {
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $mimes = [
        'html' => 'text/html; charset=UTF-8',
        'css'  => 'text/css; charset=UTF-8',
        'js'   => 'application/javascript; charset=UTF-8',
        'json' => 'application/json; charset=UTF-8',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'svg'  => 'image/svg+xml',
        'ico'  => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2'=> 'font/woff2',
        'ttf'  => 'font/ttf',
        'webp' => 'image/webp'
    ];

    if (isset($mimes[$ext])) {
        header("Content-Type: {$mimes[$ext]}");
    }
    readfile($filePath);
    exit;
}

http_response_code(404);
echo "404 Not Found";
exit;
