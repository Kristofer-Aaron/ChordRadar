<?php
// --- Page-specific settings ---
$title = "Sign In - ChordRadar";
$navbarType = "none";
$scripts = [];
$stylesheets = [];

$error = null;
$success = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $remember = isset($_POST['remember']);

    if ($email === '' || $password === '') {
        $error = "Please enter both email and password.";
    } else {
        $apiUrl = "http://localhost:3030/auth/login";
        $payload = json_encode([
            "email_address" => $email,
            "password" => $password
        ]);

        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($response, true);

        if ($httpCode === 200 && isset($data['token'])) {
            // Login successful
            if ($remember) {
                setcookie('authToken', $data['token'], time() + 60*60*24*30, "/"); // 30 days
            } else {
                setcookie('authToken', $data['token'], 0, "/"); // session cookie
            }

            // Redirect to analyze page
            header("Location: index.php?page=guitar-chords/analyze");
            exit; // stop script after redirect
        } elseif ($httpCode === 401) {
            $error = "Invalid email or password.";
        } elseif ($httpCode === 403) {
            $error = $data['error'] ?? "Access denied.";
        } else {
            $error = $data['error'] ?? "Login failed.";
        }
    }
}

// --- Capture page content ---
ob_start();
?>
<!-- HTML form here -->
<div class="container d-flex flex-column align-items-center justify-content-center">
    <div class="w-100" style="max-width:420px;">
        <div class="card bg-body-tertiary shadow">
            <div class="card-body">
                <h4 class="card-title mb-3 text-center">Sign in to ChordRadar</h4>

                <?php if ($error): ?>
                    <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>

                <form method="POST" id="signin-form">
                    <div class="mb-3">
                        <label for="email" class="form-label">Email address</label>
                        <input type="email" class="form-control bg-body-tertiary" id="email" name="email" placeholder="you@example.com" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required>
                    </div>

                    <div class="mb-3">
                        <label for="password" class="form-label">Password</label>
                        <input type="password" class="form-control bg-body-tertiary" id="password" name="password" placeholder="Password" required>
                    </div>

                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" id="remember" name="remember" <?= isset($_POST['remember']) ? 'checked' : '' ?>>
                        <label class="form-check-label" for="remember">Remember me</label>
                    </div>

                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-success">Sign in</button>
                        <a href="index.php?page=auth/sign-in-one-time-code" class="btn btn-outline-secondary">Sign in with one-time code</a>
                    </div>

                    <div class="mt-3 text-muted small text-center">
                        New to ChordRadar? <a href="index.php?page=auth/sign-up">Sign up</a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
<?php
$content = ob_get_clean();

// --- Load template ---
require __DIR__ . '/../../layouts/template.php';