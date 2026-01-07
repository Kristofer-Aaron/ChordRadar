<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Load head content from separate file !-->
    <?php require 'partials/head.html' ?>
</head>

<body>
    <!-- Load navbar from separate file !-->
    <?php require 'navbar-bootstrap.html' ?> 
    

    <div id="fretboardWrapper">
        <div id="fretboardContainer"></div>
    </div>
    
    <?php require 'footer-bootstrap.html' ?>
</body>


<!-- Bootstrap 5.3.8 script -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>

<!-- <script src="assets/js/script.js"></script> -->
<script src="assets/js/controls.js"></script>
<script src="assets/js/fretboard.js"></script>
</html>
