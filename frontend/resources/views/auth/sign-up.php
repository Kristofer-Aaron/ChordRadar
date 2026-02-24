<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Bootstrap 5.3.8 link -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">

    <!-- Load head content from separate file -->
    <?php require './partials/head.html' ?>
</head>

<body class="d-flex flex-column min-vh-100 bg-body-secondary">


    <main class="my-4">
        <div class="container d-flex flex-column align-items-center justify-content-center">
            <div class="w-100" style="max-width:420px;">
                <div class="card bg-body-tertiary shadow-sm">
                    <div class="card-body">
                        <h4 class="card-title mb-3 text-center">Sign up to ChordRadar</h4>

                        <form id="signup-form" action="register.php" method="post">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email address</label>
                                <input type="email" class="form-control bg-body-tertiary" id="email" name="email" placeholder="you@example.com" required>
                            </div>

                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" class="form-control bg-body-tertiary" id="password" name="password" placeholder="Password" required>
                            </div>

                            <div class="mb-3">
                                <label for="confirm-password" class="form-label">Confirm Password</label>
                                <input type="password" class="form-control bg-body-tertiary" id="confirm-password" name="confirm-password" placeholder="Confirm Password" required>
                            </div>

                            <hr>

                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div class="form-check">
                                    <input class="form-check-input bg-body-tertiary" type="checkbox" id="remember" name="remember">
                                    <label class="form-check-label" for="remember">Remember me</label>
                                </div>
                            </div>

                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-success">Sign up</button>
                            </div>
                        </form>

                        <div class="mt-3 text-muted small">
                            By signing up you agree to our terms and privacy policy. Which we don't have yet.
                        </div>

                        <hr>

                        <div class="mt-2 text-muted small text-center">
                            Already have an account?
                            <a href="sign-in.php">Sign in</a>
                        </div>
                    </div>
                </div>
            </div>


    </main>

    <?php require './partials/footer.html' ?>
</body>

<!-- Bootstrap 5.3.8 script -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>

<!-- <script src="assets/js/script.js"></script> -->
<!-- <script src="assets/js/controls.js"></script> -->
<script src="assets/js/theme-toggle.js"></script>
<script>
document.getElementById('passkey-btn').addEventListener('click', function(){
    // Placeholder: wire actual passkey flow here
    alert('Passkey sign-in is not implemented yet.');
});

// Optionally handle form submission client-side
document.getElementById('signin-form').addEventListener('submit', function(e){
    // allow normal POST by default; use this listener to add client-side checks if needed
});
</script>
</html>
