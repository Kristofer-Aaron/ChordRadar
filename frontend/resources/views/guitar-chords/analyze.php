<?php
$title = "Analyze Chords";

$navbarOptions = [
    'showGuitarSettingsButton' => false,
];

// Stylesheets
$stylesheets = [
    "fretboard.css",
    "slider.css"
];

// Scripts
$scripts = [

    "note-utilities.js",
    "generate-fretboard.js",
    "analyze.js",
    "sound-generator.js"
];


ob_start();
?>

<main class="my-4">
    <div class="border-top border-bottom py-4 bg-body-tertiary">
        <div class="d-flex gap-2 ml-auto mb-3 justify-content-end">
            <!-- <button class="btn btn-outline-secondary">R</button> -->
            <button class="btn btn-outline-secondary" id="playSoundButton" aria-label="Play sound">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-volume-up" viewBox="0 0 16 16">
                    <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/>
                    <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z"/>
                    <path d="M10.025 8a4.5 4.5 0 0 1-1.318 3.182L8 10.475A3.5 3.5 0 0 0 9.025 8c0-.966-.392-1.841-1.025-2.475l.707-.707A4.5 4.5 0 0 1 10.025 8M7 4a.5.5 0 0 0-.812-.39L3.825 5.5H1.5A.5.5 0 0 0 1 6v4a.5.5 0 0 0 .5.5h2.325l2.363 1.89A.5.5 0 0 0 7 12zM4.312 6.39 6 5.04v5.92L4.312 9.61A.5.5 0 0 0 4 9.5H2v-3h2a.5.5 0 0 0 .312-.11"/>
                </svg>
            </button>
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

function getRadioMidis() {
    const radios = document.querySelectorAll('input.fretboardRadio');
    const groupNames = [...new Set([...radios].map(r => r.name))];

    let midis = [];
    groupNames.forEach((name) => {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        if (checked) {
            midis.push(checked.dataset.midi)
        }
    })
    return midis.reverse();
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
        
        const gripPattern = getRadioMidis();
        const chords = MidisToChord(gripPattern);
        console.log('Calculated chords:', chords);
        renderPossibleChords(chords);
    }
});

document.getElementById('playSoundButton').addEventListener('click', () => {
    midiNotes = getRadioMidis();
    console.log("Playing notes with MIDI values:", midiNotes);
    console.log("Corresponding note names:", midiNotes.map(midi => midi === "x" ? ["x", 0] : [NoteUtilities.getNoteName(midi),NoteUtilities.getOctave(midi)]));

    const notesWithOctaves = midiNotes.map(midi => midi === "x" ? ["x", 0] : [NoteUtilities.getNoteName(midi),NoteUtilities.getOctave(midi)]);
    PlayChord(notesWithOctaves);
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