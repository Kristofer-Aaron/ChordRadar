<?php
// --- Page-specific settings ---
$title = "Sign Up - ChordRadar";
$navbarType = "none";  // simplified navbar
$navbarOptions = [
    'showSignInButton' => false,
    'showSignUpButton' => false,
    'showGuitarSettingsButton' => false
];
$stylesheets = [];
$scripts = [];

// --- Handle form POST ---
$error = null;
$success = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $firstName = trim($_POST['first-name'] ?? '');
    $lastName = trim($_POST['last-name'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm-password'] ?? '';
    $remember = isset($_POST['remember']);

    $preferences = [
        'theme' => 'light'
    ];

    if ($firstName === '' || $lastName === '' || $username === '' || $email === '' || $password === '' || $confirmPassword === '') {
        $error = "Please fill in all fields.";
    } elseif ($password !== $confirmPassword) {
        $error = "Passwords do not match.";
    } else {
        // Call Node backend registration API
        $apiUrl = "http://localhost:3030/auth/register";

        $payload = json_encode([
            "first_name" => $firstName,
            "last_name" => $lastName,
            "user_name" => $username,
            "email_address" => $email,
            "password" => $password,
            "preferences" => $preferences
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

        if ($httpCode === 201) {  // account created
            $success = "Registration successful! You can now sign in.";
            header("Location: index.php?page=auth/sign-in");
            exit;
        } elseif ($httpCode === 409) {
            $error = "An account with that email already exists.";
        } else {
            $error = $data['error'] ?? "Registration failed.";
        }
    }
}

// --- Capture page content ---
ob_start();
?>

<div class="container d-flex flex-column align-items-center justify-content-center">
    <div class="w-100" style="max-width:420px;">
        <div class="card bg-body-tertiary shadow-sm">
            <div class="card-body">
                <h4 class="card-title mb-3 text-center">Sign up to ChordRadar</h4>

                <!-- Alerts -->
                <?php if ($error): ?>
                    <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
                <?php endif; ?>
                <?php if ($success): ?>
                    <div class="alert alert-success"><?= htmlspecialchars($success) ?></div>
                <?php endif; ?>

                <form method="POST" id="signup-form">
                    <div class="mb-3">
                        <label for="first-name" class="form-label">First Name</label>
                        <input type="text" class="form-control bg-body-tertiary" id="first-name" name="first-name" placeholder="First Name" value="<?= htmlspecialchars($_POST['first-name'] ?? '') ?>" required>
                    </div>

                    <div class="mb-3">
                        <label for="last-name" class="form-label">Last Name</label>
                        <input type="text" class="form-control bg-body-tertiary" id="last-name" name="last-name" placeholder="Last Name" value="<?= htmlspecialchars($_POST['last-name'] ?? '') ?>" required>
                    </div>

                    <div class="mb-3">
                        <label for="username" class="form-label">Username</label>
                        <input type="text" class="form-control bg-body-tertiary" id="username" name="username" placeholder="Username" value="<?= htmlspecialchars($_POST['username'] ?? '') ?>" required>
                    </div>

                    <div class="mb-3">
                        <label for="email" class="form-label">Email address</label>
                        <input type="email" class="form-control bg-body-tertiary" id="email" name="email" placeholder="you@example.com" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required>
                    </div>

                    <div class="mb-3">
                        <label for="password" class="form-label">Password</label>
                        <input type="password" class="form-control bg-body-tertiary" id="password" name="password" placeholder="Password" required>
                    </div>

                    <div class="mb-3">
                        <label for="confirm-password" class="form-label">Confirm Password</label>
                        <input type="password" class="form-control bg-body-tertiary" id="confirm-password" name="confirm-password" placeholder="Confirm Password" required>
                    </div>

                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" id="remember" name="remember" <?= isset($_POST['remember']) ? 'checked' : '' ?>>
                        <label class="form-check-label" for="remember">Remember me</label>
                    </div>

                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-success">Sign up</button>
                    </div>

                    <div class="mt-3 text-muted small text-center">
                        Already have an account? <a href="index.php?page=auth/sign-in">Sign in</a>
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