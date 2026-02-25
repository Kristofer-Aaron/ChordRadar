<?php
$title = "Analyze Chords";

$navbarOptions = [
    'showGuitarSettingsButton' => false,
];

// Stylesheets
$stylesheets = [
    "fretboard.css"
];

// Scripts
$scripts = [
    "grip-to-chord.js",
    "generate-fretboard.js"
];


ob_start();
?>

<main class="my-4">
    <div class="border rounded p-4 bg-body-tertiary">
        <div class="d-flex gap-2 ml-auto mb-3 justify-content-end">
            <!-- <button class="btn btn-outline-secondary">R</button> -->
            <button class="btn btn-outline-secondary" id="resetButton" aria-label="Reset fretboard">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-arrow-counterclockwise" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2z"/>
                    <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466"/>
                </svg>
            </button>
        </div>
        <div id="fretboardWrapper">
            <div id="fretboardContainer"></div>
        </div>
        <div class="border rounded mt-3">
            <div>
                <p class="text-muted" id="possibleChords">Possible chords:</p>
            </div>

            <!-- <div>

            </div> -->
        </div>
    </div>
</main>

<?php
$content = ob_get_clean();



require __DIR__ . '/../../layouts/template.php';