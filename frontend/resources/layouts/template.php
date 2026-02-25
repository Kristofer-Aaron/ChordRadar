<?php
// Default values
$lang = $lang ?? "en";
$title = $title ?? "ChordRadar";

$requireAuth = $requireAuth ?? false;

$stylesheets = $stylesheets ?? [];
$scripts = $scripts ?? [];

$navbarType = $navbarType ?? 'default';
$navbarOptions = $navbarOptions ?? [];

$content = $content ?? "";

?>

<!DOCTYPE html>
<html lang="<?= htmlspecialchars($lang) ?>">
<head>
    <meta charset="UTF-8">
    <title><?= htmlspecialchars($title) ?></title>

    <!-- <link rel="stylesheet" href="/assets/css/style.css"> -->

    <!-- Bootstrap 5.3.8 CSS link -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">

    <!-- stylesheets -->
    <?php foreach ($stylesheets as $stylesheet): ?>
        <link rel="stylesheet" href="./assets/css/<?= htmlspecialchars($stylesheet) ?>">
    <?php endforeach; ?>

    <!-- Extra head content if needed -->
    <?= $head ?? "" ?>
</head>
<body class="d-flex flex-column min-vh-100 bg-body-secondary">

<?php
    if ($navbarType === 'default')  require __DIR__ . '/../partials/navbar.php';
    else if ($navbarType === 'auth') require __DIR__ . '/../partials/navbar-auth.php';
    else if ($navbarType === 'none') {}
    else {
        // Invalid navbar type, fallback to 
        console.warn("Invalid navbar type: " + $navbarType + ". Falling back to default navbar.");
        require __DIR__ . '/../partials/navbar.php';
    }
?>

<main class="my-4">
    <?= $content ?>
</main>

<?php require __DIR__ . '/../partials/footer.php'; ?>

<!-- Bootstrap 5.3.8 JS bundle -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>

<script src="./assets/js/theme-toggle.js"></script>

<!-- Page-specific scripts -->
<?php foreach ($scripts as $script): ?>
    <script src="./assets/js/<?= $script ?>"></script>
<?php endforeach; ?>

</body>
</html>