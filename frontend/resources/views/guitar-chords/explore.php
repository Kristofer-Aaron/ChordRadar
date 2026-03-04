<?php
$title = "Explore Chords";

$navbarOptions = [
    'showGuitarSettingsButton' => false,
];

// Stylesheets
$stylesheets = [
    "fretboard.css"
];

// Scripts
$scripts = [
    "generate-fretboard.js",
    "chord-to-grips.js",
    "explore.js"
];


ob_start();
?>

<main class="my-4">
    <div class="border rounded p-4 bg-body-tertiary">
        <div class="d-flex gap-2 ml-auto mb-3 justify-content-end">
            <!-- <button class="btn btn-outline-secondary">R</button> -->
            <button class="btn btn-outline-secondary d-none" id="resetButton" aria-label="Reset fretboard">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-arrow-counterclockwise" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2z"/>
                    <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466"/>
                </svg>
            </button>
        </div>
        <div class="border rounded my-3 p-3">

            <select class="form-select" id="rootNoteSelect" aria-label="Default select example">
                <option value="" selected>Select Root note</option>
                <option value="C">C</option>
                <option value="C#">C#</option>
                <option value="D">D</option>
                <option value="D#">D#</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="F#">F#</option>
                <option value="G">G</option>
                <option value="G#">G#</option>
                <option value="A">A</option>
                <option value="A#">A#</option>
                <option value="B">B</option>
            </select>

            <select class="form-select" id="tritoneSelect" aria-label="Default select example">
                <option value="" selected>Select Tritone</option>
                <option value="maj">Major</option>
                <option value="min">Minor</option>
                <option value="sus2">Suspended 2</option>
                <option value="sus4">Suspended 4</option>
                <option value="5">5th</option>
                <option value="dim">Diminished</option>
                <option value="aug">Augmented</option>
            </select>

            <select class="form-select" id="addSelect" aria-label="Default select example">
                <option value="" selected>Select Add</option>
                <option value="">None</option>
                <option value="m2">Minor 2nd</option>
                <option value="M2">Major 2nd</option>
                <option value="m3">Minor 3rd</option>
                <option value="M3">Major 3rd</option>
                <option value="4">Perfect 4th</option>
                <option value="A4">Augmented 4th</option>
                <option value="D5">Diminished 5th</option>
                <option value="5">Perfect 5th</option>
                <option value="m6">Minor 6th</option>
                <option value="M6">Major 6th</option>
                <option value="m7">Minor 7th</option>
                <option value="M7">Major 7th</option>
            </select>

            <select class="form-select" id="slashNoteSelect" aria-label="Default select example">
                <option value="" selected>Select Slash note</option>
                <option value="C">C</option>
                <option value="C#">C#</option>
                <option value="D">D</option>
                <option value="D#">D#</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="F#">F#</option>
                <option value="G">G</option>
                <option value="G#">G#</option>
                <option value="A">A</option>
                <option value="A#">A#</option>
                <option value="B">B</option>
            </select>


            <div class="my-2">
                <label for="gripSpanInput">Grip Span</label>
                <input class="form-control" name="gripSpan" type="number" value="3" min="1" max="12" id="gripSpanInput" placeholder="Grip span (default 3)">
            </div>

            <button class="btn btn-primary" onclick="ExploreChord()">Explore Chord</button>
        </div>
        <div id="fretboardWrapper">
            <div id="fretboardContainer"></div>
        </div>
        <div id="possibleGrips" class="border rounded mt-3 p-4 d-flex flex-wrap gap-2 justify-content-center">    
            <p class="text-muted mb-1">Enter a chord in the selector</p>
        </div>
    </div>
</main>

<script>

    function ExploreChord() {
        const rootNote = document.getElementById('rootNoteSelect').value;
        const tritone = document.getElementById('tritoneSelect').value;
        const add = document.getElementById('addSelect').value;
        const slashNote = document.getElementById('slashNoteSelect').value;
        const gripSpan = document.getElementById('gripSpanInput').value;

        json = {
            root:rootNote,
            tri:tritone,
            add:add,
            slash:slashNote,
            gripSpan:gripSpan,
            tuning: ["E", "A", "D", "G", "B", "E"]
        };

        grips = JSON.parse(ChordToGrips(JSON.stringify(json)));
        renderPossibleGrips(grips);
    }

    // helper to render results in the display container
    function renderPossibleGrips(grips) {
        const container = document.getElementById("possibleGrips");
        container.innerHTML = "";
        grips.forEach(grip => {
            console.log("Rendering grip:", grip);
            const div = document.createElement('div');
            div.className = "badge bg-secondary fs-6";
            div.textContent = grip.join("-");
            div.style.cursor = "pointer";
            div.onclick = () => {
                selectRadios(grip);
            };
            container.appendChild(div);
        });
    }

    function selectRadios(grip) {
        // grip is array of fret numbers for each string, -1 for open, 0 for muted
        grip.forEach((fret, stringIndex) => {
            if (fret >= 0) {
                const radio = document.getElementById(`s${stringIndex}f${fret}`);
                if (radio) {
                    radio.checked = true;
                }
            }
            if (fret == 'x') {
                // find all radios for this string and uncheck
                const radios = document.querySelectorAll(`input[name="s${stringIndex}"]`);
                radios.forEach(radio => radio.checked = false);
            }
        });
    }
</script>



<?php
$content = ob_get_clean();

require __DIR__ . '/../../layouts/template.php';