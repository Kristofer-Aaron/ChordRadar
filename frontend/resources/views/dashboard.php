<?php
// Example dashboard page - requires authentication
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - ChordRadar</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    <?php require './partials/head.html' ?>
</head>
<body class="d-flex flex-column min-vh-100">
    <?php require './partials/navbar.php' ?>

    <main class="flex-grow-1 my-4">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <h1>Welcome to ChordRadar</h1>
                    <p class="lead">You are logged in! <span id="user-email"></span></p>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Your Account</h5>
                            <p class="card-text">
                                <strong>Email:</strong> <span id="account-email"></span><br>
                                <strong>Logged in:</strong> <span id="login-status">Yes</span>
                            </p>
                            <a href="sign-out.php" class="btn btn-danger btn-sm">Sign out</a>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Features</h5>
                            <ul class="card-text">
                                <li>View all chords</li>
                                <li>Save favorite chords</li>
                                <li>Manage guitar settings</li>
                                <li>Learn guitar techniques</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-12">
                    <a href="index.php" class="btn btn-primary">Go to Main Application</a>
                </div>
            </div>
        </div>
    </main>

    <?php require './partials/footer.html' ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/theme-toggle.js"></script>
    <script src="assets/js/auth.js"></script>

    <script>
        // Check authentication on page load
        window.addEventListener('load', function() {
            // Require authentication - redirect to login if not logged in
            AuthModule.requireAuth();

            // Display user info
            const email = AuthModule.getEmail();
            if (email) {
                document.getElementById('user-email').textContent = `(${email})`;
                document.getElementById('account-email').textContent = email;
            }
        });
    </script>
</body>
</html>
