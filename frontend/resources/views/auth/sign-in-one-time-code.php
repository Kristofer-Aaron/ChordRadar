<?php
// --- Page-specific settings ---
$title = "Sign In - ChordRadar";
$navbarType = "none";
$scripts = [];
$stylesheets = [];

$error = null;
$success = null;

ob_start();
?>

<body class="d-flex flex-column min-vh-100 bg-body-secondary">
    <main class="my-4">
        <div class="container d-flex align-items-center justify-content-center">
            <div class="w-100" style="max-width: 420px;">
                <div class="card bg-body-tertiary shadow">
                    <div class="card-body">
                        <h4 class="card-title text-center mb-3">Sign in using one-time code</h4>

                        <hr>

                        <div id="message" class="alert" style="display: none;"></div>

                        <form id="form">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email address</label>
                                <input type="email" class="form-control bg-body-tertiary" id="email" name="email" placeholder="you@example.com" required>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">6-Digit Code</label>
                                <input type="text" class="form-control text-center bg-body-tertiary" id="code" placeholder="000000" maxlength="6" pattern="\d{6}" inputmode="numeric" required>
                            </div>

                            <hr>


                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div class="form-check">
                                    <input class="form-check-input focus-none bg-body-tertiary" type="checkbox" id="remember" name="remember">
                                    <label class="form-check-label" for="remember">Remember me</label>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-success w-100">Sign in</button>

                            <div class="mt-3 text-muted small">
                                By signing in you agree to our terms and privacy policy. Which we don't have yet.
                            </div>
                        </form>

                        <hr>
                        <div class="mt-2 text-muted small text-center">
                            Back to <a href="index.php?page=auth/sign-in">Simple sign in</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/theme-toggle.js"></script>
    <script>
        const API_BASE_URL = 'http://localhost:3030';
        const form = document.getElementById('form');
        const msgEl = document.getElementById('message');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const code = document.getElementById('code').value;

            if (!email) {
                msgEl.textContent = 'Session expired. Please sign in again.';
                msgEl.className = 'alert alert-danger';
                msgEl.style.display = 'block';
                return;
            }

            msgEl.style.display = 'none';

            try {
                const res = await fetch(`http://localhost:3030/auth/login/totp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email_address: email, totp_token: code })
                });

                const data = await res.json();

                if (!res.ok) {
                    msgEl.textContent = data.error || '2FA verification failed';
                    msgEl.className = 'alert alert-danger';
                    msgEl.style.display = 'block';
                    return;
                }

                localStorage.removeItem('pendingEmail');
                msgEl.textContent = '2FA verified! Redirecting...';
                msgEl.className = 'alert alert-success';
                msgEl.style.display = 'block';

                setTimeout(() => {
                    window.location.href = 'index.php';
                }, 800);

            } catch (err) {
                msgEl.textContent = 'Error: ' + err.message;
                msgEl.className = 'alert alert-danger';
                msgEl.style.display = 'block';
            }
        });
    </script>

<?php
$content = ob_get_clean();

// --- Load template ---
require __DIR__ . '/../../layouts/template.php';