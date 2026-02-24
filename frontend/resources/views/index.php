<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Bootstrap 5.3.8 link -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">

    <!-- Load head content from separate file !-->
    <?php require './partials/head.html' ?>

</head>

<body class="d-flex flex-column min-vh-100 bg-body-secondary">
    <!-- Load navbar from separate file -->
    <?php
    $navbarOptions = [
        'showGuitarSettingsButton' => true,
        'showSignInButton' => true,
        'showSignOutButton' => true,
        'showSignUpButton' => true,
    ];

    require './partials/navbar.php';
    ?> 

    <!-- Main -->

    <main class="my-4">
        <div class="container border rounded p-4 bg-body-tertiary">
            <div class="d-flex gap-2 ml-auto mb-3">
                <!-- <button class="btn btn-outline-secondary">R</button> -->
                <button class="btn btn-outline-secondary" id="resetButton">Reset</button>
            </div>
            <div id="fretboardWrapper">
                <div id="fretboardContainer"></div>
            </div>
            <div class="border rounded mt-3 py-3">
                <p class="text-center" id="possibleChords">Possible chords:</p>
                <!-- <hr> -->
                <!-- <div>
                    <h4 class="text-center text-muted">Enter a chord pattern</h4>
                    <div class="container px-4">

                    </div>
                </div> -->
            </div>


        </div>

    </main>

    <!-- Footer -->

    <?php require './partials/footer.html' ?>
</body>

<!-- Bootstrap 5.3.8 script -->
<!-- <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script> -->

<!-- <script src="assets/js/script.js"></script> -->
<!-- <script src="assets/js/controls.js"></script> -->
<script src="assets/js/grip-to-chord.js"></script>
<script src="assets/js/generate-fretboard.js"></script>
<script src="assets/js/theme-toggle.js"></script>

<script>


const API_BASE_URL = "http://localhost:3030";

async function testApiConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "OPTIONS",
        });

        if (response.ok) {
            console.log("OK");
        } else {
            console.warn("Status: ", response.status);
        }
    } catch (err) {
        console.error("Error: ", err);
    }
}

testApiConnection();
</script>

</html>