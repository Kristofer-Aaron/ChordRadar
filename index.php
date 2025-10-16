<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Load head content from separate file !-->
    <?php require 'partials/head.html' ?>
</head>

<body>
    <!-- Load navbar content from separate file !-->
    <nav>
        <?php require 'partials/navbar.html' ?> 
    </nav>

    <div id="fretboardWrapper">
        <div id="fretboardContainer"></div>
    </div>
</body>

<!-- <script src="assets/js/script.js"></script> -->
<script src="assets/js/controls.js"></script>
<script src="assets/js/fretboard.js"></script>
</html>
