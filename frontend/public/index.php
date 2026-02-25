<?php

// Default route
$route = $_GET['page'] ?? 'guitar-chords/analyze';

// Convert route into file path
$viewPath = "../resources/views/" . $route . ".php";

// Security: prevent directory traversal
$realBase = realpath("../resources/views");
$realView = realpath($viewPath);

if ($realView && str_starts_with($realView, $realBase)) {
    require $realView;
} else {
    http_response_code(404);
    echo "404 - Page Not Found";
}