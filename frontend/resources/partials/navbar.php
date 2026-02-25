<?php
$navbarOptions = $navbarOptions ?? [];

// Helper function to generate router links
function route($path) {
    return "index.php?page=" . urlencode($path);
}

// --- Determine auth state ---
$isLoggedIn = false;

// Check cookie (server-side) for auth token
if (!empty($_COOKIE['authToken'])) {
    $isLoggedIn = true;
}

// Optional: allow overriding via $navbarOptions
$showSignIn = $navbarOptions['showSignInButton'] ?? (!$isLoggedIn);
$showSignUp = $navbarOptions['showSignUpButton'] ?? (!$isLoggedIn);
$showSignOut = $navbarOptions['showSignOutButton'] ?? ($isLoggedIn);
$showGuitarSettings = $navbarOptions['showGuitarSettingsButton'] ?? $isLoggedIn;
?>

<nav class="navbar navbar-expand-sm px-4 border-bottom bg-body-tertiary">
    <a class="navbar-brand" href="<?= route('guitar-chords/analyze') ?>">ChordRadar</a>
    
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse w-100" id="navbarCollapse">
        <div class="me-auto">
            <ul class="navbar-nav">
                <li>
                    <a class="nav-link" href="<?= route('guitar-chords/analyze') ?>">Analyze Chords</a>
                </li>
                <li>
                    <a class="nav-link" href="<?= route('guitar-chords/explore') ?>">Explore Chords</a>
                </li>
            </ul>
        </div>

        <div class="justify-content-end">
            <ul class="navbar-nav ms-auto">

                <!-- Theme Toggle Button -->
                <li class="nav-item">
                    <button class="btn btn-outline-secondary btn-sm" id="theme-toggle" type="button">
                        <span id="theme-toggle-label">Dark</span>
                    </button>
                </li>

                <!-- Guitar Settings Button -->
                <?php if ($showGuitarSettings): ?>
                    <li class="nav-item">
                        <a class="btn btn-outline-primary btn-sm ms-2" href="<?= route('guitar-settings') ?>" role="button">
                            Guitar Settings
                        </a>
                    </li>
                <?php endif; ?>

                <!-- Sign In Button -->
                <?php if ($showSignIn): ?>
                    <li class="nav-item">
                        <a class="btn btn-outline-secondary btn-sm ms-2" href="<?= route('auth/sign-in') ?>" role="button">
                            Sign in
                        </a>
                    </li>
                <?php endif; ?>

                <!-- Sign Out Button -->
                <?php if ($showSignOut): ?>
                    <li class="nav-item">
                        <a class="btn btn-outline-secondary btn-sm ms-2" href="<?= route('auth/sign-out') ?>" role="button">
                            Sign out
                        </a>
                    </li>
                <?php endif; ?>

                <!-- Sign Up Button -->
                <?php if ($showSignUp): ?>
                    <li class="nav-item">
                        <a class="btn btn-outline-primary btn-sm ms-2" href="<?= route('auth/sign-up') ?>" role="button">
                            Sign up
                        </a>
                    </li>
                <?php endif; ?>

            </ul>
        </div>
    </div>
</nav>