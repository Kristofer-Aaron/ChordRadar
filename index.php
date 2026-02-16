<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Bootstrap 5.3.8 link -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">

    <!-- Load head content from separate file !-->
    <?php require './partials/head.html' ?>
</head>

<body class="d-flex flex-column min-vh-100" style=" background-image: url('assets/images/wood2.png');">
    <!-- Load navbar from separate file !-->
    <?php require './partials/navbar.html' ?> 

    <main style="margin: 100px 0px;">
        <div id="fretboardWrapper">
            <div id="fretboardContainer"></div>
        </div>
    </main>

    <?php require './partials/footer.html' ?>
</body>

<!-- Bootstrap 5.3.8 script -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>

<!-- <script src="assets/js/script.js"></script> -->
<!-- <script src="assets/js/controls.js"></script> -->
<script src="assets/js/generate-fretboard.js"></script>
<script src="assets/js/theme-toggle.js"></script>
</html>
