<?php
// --- 1. Page-specific settings ---
$title = "Sign Out - ChordRadar";
$navbarType = "none"; // simplified navbar for auth pages
$stylesheets = [];
$scripts = ["theme-toggle.js"]; // optional page-specific JS

// --- 2. Sign out logic ---
// Clear auth token cookie
if (isset($_COOKIE['authToken'])) {
    setcookie('authToken', '', time() - 3600, "/"); // expire cookie
}

// Optional: pass JS flag to clear sessionStorage token if needed
$clearSessionToken = true;

// --- 3. Capture page content ---
ob_start();
?>

<div class="d-flex align-items-center justify-content-center min-vh-100 bg-body-secondary">
    <div class="text-center">
        <div class="spinner-border mb-3" role="status">
            <span class="visually-hidden">Signing out...</span>
        </div>
        <h3>Signing out...</h3>
        <p class="text-muted">Please wait while we sign you out.</p>
    </div>
</div>

<script>
<?php if (!empty($clearSessionToken)): ?>
// Clear sessionStorage auth token if used
sessionStorage.removeItem('authToken');
<?php endif; ?>

// Redirect to sign-in page after 1 second
setTimeout(() => {
    window.location.href = 'index.php?page=auth/sign-in';
}, 1000);
</script>

<?php
$content = ob_get_clean();

// --- 4. Load the template ---
require __DIR__ . '/../../layouts/template.php';