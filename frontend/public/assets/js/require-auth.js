/**
 * Page Protection Utility
 * Include this in pages that require authentication
 * 
 * Usage in HTML:
 * <script src="assets/js/auth.js"></script>
 * <script src="assets/js/require-auth.js"></script>
 */

// Check if user is authenticated when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (!AuthModule.isLoggedIn()) {
        // Not logged in, redirect to sign-in
        window.location.href = 'sign-in.php';
    }
});

// Alternative: Use before DOMContentLoaded for faster redirect
if (typeof AuthModule === 'undefined') {
    // auth.js not loaded, redirect immediately
    window.location.href = 'sign-in.php';
} else if (!AuthModule.isLoggedIn()) {
    window.location.href = 'sign-in.php';
}
