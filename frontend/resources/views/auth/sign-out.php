<!DOCTYPE html>
<html lang="en">
<head>
    <title>Sign out - ChordRadar</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="d-flex align-items-center justify-content-center min-vh-100 bg-body-secondary">
    <div class="text-center">
        <div class="spinner-border mb-3" role="status">
            <span class="visually-hidden">Signing out...</span>
        </div>
        <h3>Signing out...</h3>
        <p class="text-muted">Please wait while we sign you out.</p>
    </div>

    <script src="assets/js/auth.js"></script>
    <script>
        async function logout() {
            try {
                await AuthModule.logout();
            } catch (error) {
                console.error('Logout error:', error);
                AuthModule.clear();
            }
            
            // Redirect to sign-in page
            setTimeout(() => {
                window.location.href = 'index.php';
            }, 1200);
        }

        // Start logout when page loads
        window.addEventListener('load', logout);
    </script>
</body>

<script src="assets/js/theme-toggle.js"></script>
</html>
