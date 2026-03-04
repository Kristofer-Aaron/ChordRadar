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
        <div id="possibleChords" class="border rounded mt-3 p-4 d-flex flex-wrap gap-2 justify-content-center">    
            <p class="text-muted mb-1">Enter a chord in the fretboard</p>
        </div>
    </div>
</main>

<script>

    // helper to render results in the display container
function renderPossibleChords(chords, isMessage = false) {
    const container = document.getElementById("possibleChords");
    container.innerHTML = "";

    if (isMessage) {
        // single message, wrap in span
        const msg = document.createElement('span');
        msg.className = "text-info";
        msg.textContent = chords;
        container.appendChild(msg);
        return;
    }

    if (chords.length === 0) {
        const msg = document.createElement('span');
        msg.className = "text-muted";
        msg.textContent = "Enter a chord in the fretboard";
        container.appendChild(msg);
        return;
    }

    // chords should be an array
    chords.forEach(chord => {
        const div = document.createElement('div');
        div.className = "badge bg-secondary fs-6";
        div.textContent = chord;
        container.appendChild(div);
    });
}


function getRadioValues() {
    const radios = document.querySelectorAll('input.fretboardRadio');
    const groupNames = [...new Set([...radios].map(r => r.name))];
    return groupNames.map(name => {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : "x";
    }).reverse();
}

// Toggle/uncheck radio buttons
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains("fretboardRadio")) {
        const radio = e.target;
        const group = document.getElementsByName(radio.name);
        if (radio.wasChecked) {
            radio.checked = false;
        }

        group.forEach(r => r.wasChecked = r.checked);
        
        const gripPattern = getRadioValues();
        const gripPatternString = gripPattern.join("");

        const chords = GripToChord(gripPattern, Tuning, NotesFlat);
        console.log('Calculated chords:', chords);
        renderPossibleChords(chords);
    }
});

document.getElementById('resetButton').addEventListener('click', () => {
    const radios = document.querySelectorAll('input.fretboardRadio');

    radios.forEach(radio => {
        radio.checked = false;
        radio.wasChecked = false;
    });

    logValues(getRadioValues());
    const container = document.getElementById("possibleChords");
    container.innerHTML = "";

}, { passive: true });

</script>

<?php
$content = ob_get_clean();



require __DIR__ . '/../../layouts/template.php';