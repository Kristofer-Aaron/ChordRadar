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
const token = sessionStorage.getItem('authToken');
<?php endif; ?>

// Call logout endpoint to remove token from API
async function performLogout() {
    try {
        const authToken = sessionStorage.getItem('authToken') || getCookie('authToken');
        if (authToken) {
            const response = await fetch('http://localhost:3030/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${authToken}`
                },
                credentials: 'include',
                mode: 'cors'
            });

            if (response.ok) {
                console.log('Token removed from API');
            } else {
                console.warn('Failed to remove token from API:', response.status);
            }
        }
    } catch (error) {
        console.error('Error calling logout endpoint:', error);
    } finally {
        // Clear local storage and redirect
        sessionStorage.removeItem('authToken');
        window.location.href = 'index.php?page=auth/sign-in';
    }
}

// Helper function to get cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Start logout process after a brief delay
setTimeout(performLogout, 1000);
</script>

<?php
$content = ob_get_clean();

// --- 4. Load the template ---
require __DIR__ . '/../../layouts/template.php';