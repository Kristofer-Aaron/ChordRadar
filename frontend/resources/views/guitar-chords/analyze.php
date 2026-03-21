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
    "sound-generator.js",
    "suede-texture-renderer.js"
];


ob_start();
?>

<main class="my-4">
  <div class="d-flex flex-column align-items-center min-vw-100">

    <!-- Fretboard -->
    <div class="border-top border-bottom rounded-0 border-md-1 py-4 p-md-4 bg-body-tertiary mb-4 w-auto mw-100">
      <div class="d-flex gap-2 mb-3 px-4 px-md-0">

        <!-- Square buttons -->

        <button class="btn btn-outline-secondary square-btn" id="resetButton">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-arrow-counterclockwise" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2z"/>
          </svg>
        </button>

        <button class="btn btn-outline-secondary square-btn" id="playSoundButton">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-volume-up" viewBox="0 0 16 16">
            <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/>
          </svg>
        </button>
      </div>

      <div id="fretboardWrapper">
        <div id="fretboardContainer">

        </div>
      </div>
    </div>

    <!-- Bottom section -->
    <div class="row w-100 justify-content-center">

      <!-- Possible Chords -->
      <div class="col-12 col-md-3 mb-3">
        <div class="border rounded p-3 h-100 bg-body-tertiary">
          <h5 class="text-center mb-3">Possible Chords</h5>
          <hr>

          <div id="possibleChords" class="d-flex flex-column align-items-center gap-2 w-100">
            <p class="text-muted text-center mb-1">Enter a chord in the fretboard</p>
          </div>
        </div>
      </div>

      <!-- Settings -->
      <div class="col-12 col-md-3 mb-3">
        <div class="border rounded p-3 h-100 bg-body-tertiary">
          <h5 class="text-center mb-3">Guitar Settings</h5>

          <hr>
          <div class="mb-3">
            <label class="form-label">Tuning</label>
            <select class="form-select">
              <option>Standard</option>
              <option>Drop D</option>
              <option>Open G</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">Handedness</label>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="handedness" checked>
              <label class="form-check-label">Right</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="handedness">
              <label class="form-check-label">Left</label>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Note Display</label>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="noteDisplay" checked>
              <label class="form-check-label">Sharp (#)</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="noteDisplay">
              <label class="form-check-label">Flat (b)</label>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>
</main>

<style>
  .square-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Make chord items full width + centered */
  #possibleChords > * {
    width: 100%;
    text-align: center;
  }
</style>

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