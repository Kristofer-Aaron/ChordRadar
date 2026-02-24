<!DOCTYPE html>
<html lang="en" data_bs-theme="dark">

<head>
    <title>Sign in - ChordRadar</title>

    <!-- Bootstrap 5.3.8 link -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
    <!-- Load head content from separate file -->
    <?php require './partials/head.html' ?>

    <style>
        .loading-spinner {
            display: none;
        }
        .alert {
            margin-bottom: 1rem;
        }
    </style>
</head>

<body class="d-flex flex-column min-vh-100 bg-body-secondary">

    <main class="my-4">
        <div class="container d-flex flex-column align-items-center justify-content-center">
            <div class="w-100" style="max-width:420px;">
                <div class="card bg-body-tertiary shadow">
                    <div class="card-body">
                        <h4 class="card-title mb-3 text-center">Sign in to ChordRadar</h4>

                        <!-- Alert messages -->
                        <div id="error-alert" class="alert alert-danger alert-dismissible fade show" role="alert" style="display: none;">
                            <span id="error-message"></span>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>

                        <div id="success-alert" class="alert alert-success alert-dismissible fade show" role="alert" style="display: none;">
                            <span id="success-message">Login successful! Redirecting...</span>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>

                        <!-- Sign in Form -->
                        <form id="signin-form" style="display: block;">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email address</label>
                                <input type="email" class="form-control bg-body-tertiary" id="email" name="email" placeholder="you@example.com" required>
                            </div>

                            <div class="mb-3">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" class="form-control bg-body-tertiary" id="password" name="password" placeholder="Password" required>
                            </div>

                            <hr>

                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div class="form-check">
                                    <input class="form-check-input focus-none bg-body-tertiary" type="checkbox" id="remember" name="remember">
                                    <label class="form-check-label" for="remember">Remember me</label>
                                </div>
                            </div>

                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-success" id="signin-btn">
                                    <span class="signin-text">Sign in</span>
                                    <span class="spinner-border spinner-border-sm loading-spinner ms-2" role="status" aria-hidden="true"></span>
                                </button>
                                <a href="./sign-in-one-time-code.php" class="btn btn-outline-secondary">Sign in with one-time code</a>


                                <!-- <button type="button" class="btn btn-outline-secondary" id="passkey-btn">Sign in with Passkey</button> -->
                            </div>
                        </form>

                        <div class="mt-3 text-muted small">
                            By signing in you agree to our terms and privacy policy. Which we don't have yet.
                        </div>

                        <hr>

                        <div class="mt-2 text-muted small text-center">
                            New to ChordRadar?
                            <a href="sign-up.php">Sign up</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <?php require './partials/footer.html' ?>
</body>

<!-- Bootstrap 5.3.8 script -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
<script src="assets/js/theme-toggle.js"></script>

<script>
const API_BASE_URL = 'http://localhost:3030';
const EMAIL_STORAGE_KEY = 'authEmail';

// DOM
const signinForm = document.getElementById('signin-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const signinBtn = document.getElementById('signin-btn');

const errorAlert = document.getElementById('error-alert');
const errorMessage = document.getElementById('error-message');
const successAlert = document.getElementById('success-alert');
const successMessage = document.getElementById('success-message');

let pendingEmail = null;

// Load saved email
window.addEventListener('load', () => {
    const saved = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (saved) {
        emailInput.value = saved;
        rememberCheckbox.checked = true;
    }
});

function showError(msg) {
    errorMessage.textContent = msg;
    errorAlert.style.display = 'block';
    successAlert.style.display = 'none';
}

function showSuccess(msg) {
    successMessage.textContent = msg;
    successAlert.style.display = 'block';
    errorAlert.style.display = 'none';
}

function hideAlerts() {
    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';
}

function setLoading(state) {
    signinBtn.disabled = state;
    emailInput.disabled = state;
    passwordInput.disabled = state;

    const spinner = signinBtn.querySelector('.loading-spinner');
    const text = signinBtn.querySelector('.signin-text');

    spinner.style.display = state ? 'inline-block' : 'none';
    text.textContent = state ? 'Signing in...' : 'Sign in';
}

// -------------------- LOGIN --------------------

signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlerts();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        return showError('Please enter both email and password.');
    }

    if (rememberCheckbox.checked) {
        localStorage.setItem(EMAIL_STORAGE_KEY, email);
    } else {
        localStorage.removeItem(EMAIL_STORAGE_KEY);
    }

    setLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email_address: email,
                password
            })
        });

        const data = await response.json();

        if (response.status === 401) {
            return showError('Invalid email or password.');
        }

        if (response.status === 403) {
            return showError(data.error || 'Access denied.');
        }

        if (response.ok) {
            showSuccess('Login successful! Redirecting...');

            token = data.token;

            if (rememberCheckbox.checked) {
                localStorage.setItem('authToken', token);
            } else {
                sessionStorage.setItem('authToken', token);
            }

            setTimeout(() => {
                window.location.href = 'index.php';
            }, 1200);
        } else {
            showError(data.error || 'Login failed.');
        }

    } catch (err) {
        console.error(err);
        showError('Unable to connect to server.');
    } finally {
        setLoading(false);
    }
});

// -------------------- 2FA --------------------

verify2FABtn.addEventListener('click', async () => {
    const code = totpInput.value.trim();

    if (!/^\d{6}$/.test(code)) {
        return showError('Enter a valid 6-digit code.');
    }

    verify2FABtn.disabled = true;
    const originalText = verify2FABtn.textContent;
    verify2FABtn.textContent = 'Verifying...';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login/2fa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email_address: pendingEmail,
                totp_token: code
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return showError(data.error || 'Invalid code.');
        }

        showSuccess('2FA verified! Redirecting...');
        setTimeout(() => {
            window.location.href = 'index.php';
        }, 1200);

    } catch (err) {
        console.error(err);
        showError('2FA verification failed.');
    } finally {
        verify2FABtn.disabled = false;
        verify2FABtn.textContent = originalText;
    }
});

totpInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verify2FABtn.click();
});
</script>
