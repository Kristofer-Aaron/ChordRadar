<?php
    $navbarOptions = $navbarOptions ?? [];
?>

<nav class="navbar navbar-expand-sm px-4 border-bottom bg-body-tertiary">
    <a class="navbar-brand" href="#">ChordRadar</a>
    
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExample02" aria-controls="navbarsExample02" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse justify-content-end" id="navbarsExample02">
        <ul class="navbar-nav mr-auto">
            <li class="nav-item">
                <button class="btn btn-outline-secondary btn-sm" id="theme-toggle" type="button">
                    <span id="theme-toggle-label">Dark</span>
                </button>
            </li>

            <!-- Guitar Settings Button -->
            <?php if (!empty($navbarOptions['showGuitarSettingsButton'])): ?>
                <li class="nav-item">
                    <button class="btn btn-outline-primary btn-sm ms-2" id="guitar-settings-btn" type="button">
                        Guitar Settings
                    </button>
                </li>
            <?php endif; ?>

            <!-- Sign in Button -->
            <?php if (!empty($navbarOptions['showSignInButton'])): ?>
                <li class="nav-item">
                    <a class="btn btn-outline-secondary btn-sm ms-2" href="./sign-in.php" role="button">
                        Sign in
                    </a>
                </li>
            <?php endif; ?>

            <!-- Sign out Button -->
            <?php if (!empty($navbarOptions['showSignOutButton'])): ?>
                <li class="nav-item">
                    <a class="btn btn-outline-secondary btn-sm ms-2" href="./sign-out.php" role="button">
                        Sign out
                    </a>
                </li>
            <?php endif; ?>

            <!-- Sign up Button -->
            <?php if (!empty($navbarOptions['showSignUpButton'])): ?>
                <li class="nav-item">
                    <a class="btn btn-outline-primary btn-sm ms-2" href="./sign-up.php" role="button">
                        Sign up
                    </a>
                </li>
            <?php endif; ?>

        </ul>
    </div>
</nav>