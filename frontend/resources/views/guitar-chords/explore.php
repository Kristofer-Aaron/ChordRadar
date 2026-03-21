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
    "note-utilities.js",
    "generate-fretboard.js",
    "chord-to-grips.js",
    "explore.js",
    "sound-generator.js"
];


ob_start();
?>

<main class="my-4">
  <div class="container d-flex flex-column align-items-center">

    <!-- ===================== -->
    <!-- CHORD SELECTOR (TOP) -->
    <!-- ===================== -->
    <div class="w-100 border rounded p-3 mb-4">
  <h5 class="text-center mb-3">Select Chord</h5>

  <!-- ROOT NOTE -->
  <div class="mb-3">
    <label class="form-label">Root Note</label>
    <div class="btn-group flex-wrap w-100">

      <!-- Notes -->
      <input type="radio" class="btn-check" name="rootNote" id="rootC" value="C">
      <label class="btn btn-outline-secondary" for="rootC">C</label>

      <input type="radio" class="btn-check" name="rootNote" id="rootCsharp" value="C#">
      <label class="btn btn-outline-secondary" for="rootCsharp">C#</label>

      <input type="radio" class="btn-check" name="rootNote" id="rootD" value="D">
      <label class="btn btn-outline-secondary" for="rootD">D</label>

      <input type="radio" class="btn-check" name="rootNote" id="rootDsharp" value="D#">
      <label class="btn btn-outline-secondary" for="rootDsharp">D#</label>

      <input type="radio" class="btn-check" name="rootNote" id="rootE" value="E">
      <label class="btn btn-outline-secondary" for="rootE">E</label>

      <input type="radio" class="btn-check" name="rootNote" id="rootF" value="F">
      <label class="btn btn-outline-secondary" for="rootF">F</label>

      <input type="radio" class="btn-check" name="rootNote" id="rootFsharp" value="F#">
      <label class="btn btn-outline-secondary" for="rootFsharp">F#</label>

      <input type="radio" class="btn-check" name="rootNote" id="rootG" value="G">
      <label class="btn btn-outline-secondary" for="rootG">G</label>

      <input type="radio" class="btn-check" name="rootNote" id="rootGsharp" value="G#">
      <label class="btn btn-outline-secondary" for="rootGsharp">G#</label>

      <input type="radio" class="btn-check" name="rootNote" id="rootA" value="A">
      <label class="btn btn-outline-secondary" for="rootA">A</label>

      <input type="radio" class="btn-check" name="rootNote" id="rootAsharp" value="A#">
      <label class="btn btn-outline-secondary" for="rootAsharp">A#</label>

      <input type="radio" class="btn-check" name="rootNote" id="rootB" value="B">
      <label class="btn btn-outline-secondary" for="rootB">B</label>

    </div>
  </div>

  <!-- CHORD TYPE -->
  <div class="mb-3">
    <label class="form-label">Chord Type</label>
    <div class="btn-group flex-wrap w-100">

      <input type="radio" class="btn-check" name="tritone" id="triMaj" value="maj">
      <label class="btn btn-outline-secondary" for="triMaj">Maj</label>

      <input type="radio" class="btn-check" name="tritone" id="triMin" value="min">
      <label class="btn btn-outline-secondary" for="triMin">Min</label>

      <input type="radio" class="btn-check" name="tritone" id="triSus2" value="sus2">
      <label class="btn btn-outline-secondary" for="triSus2">Sus2</label>

      <input type="radio" class="btn-check" name="tritone" id="triSus4" value="sus4">
      <label class="btn btn-outline-secondary" for="triSus4">Sus4</label>

      <input type="radio" class="btn-check" name="tritone" id="tri5" value="5">
      <label class="btn btn-outline-secondary" for="tri5">5</label>

      <input type="radio" class="btn-check" name="tritone" id="triDim" value="dim">
      <label class="btn btn-outline-secondary" for="triDim">Dim</label>

      <input type="radio" class="btn-check" name="tritone" id="triAug" value="aug">
      <label class="btn btn-outline-secondary" for="triAug">Aug</label>

    </div>
  </div>

  <!-- ADD -->
  <div class="mb-3">
    <label class="form-label">Add</label>
    <div class="btn-group flex-wrap w-100">

      <input type="radio" class="btn-check" name="add" id="addNone" value="" checked>
      <label class="btn btn-outline-secondary" for="addNone">None</label>

      <input type="radio" class="btn-check" name="add" id="addM7" value="M7">
      <label class="btn btn-outline-secondary" for="addM7">M7</label>

      <input type="radio" class="btn-check" name="add" id="addm7" value="m7">
      <label class="btn btn-outline-secondary" for="addm7">m7</label>

      <input type="radio" class="btn-check" name="add" id="add9" value="9">
      <label class="btn btn-outline-secondary" for="add9">9</label>

    </div>
  </div>

  <!-- SLASH NOTE -->
  <div class="mb-3">
    <label class="form-label">Slash Note</label>
    <div class="btn-group flex-wrap w-100">

      <input type="radio" class="btn-check" name="slashNote" id="slashNone" value="" checked>
      <label class="btn btn-outline-secondary" for="slashNone">None</label>

      <!-- reuse notes -->
      <input type="radio" class="btn-check" name="slashNote" id="slashC" value="C">
      <label class="btn btn-outline-secondary" for="slashC">C</label>

      <input type="radio" class="btn-check" name="slashNote" id="slashD" value="D">
      <label class="btn btn-outline-secondary" for="slashD">D</label>

      <input type="radio" class="btn-check" name="slashNote" id="slashE" value="E">
      <label class="btn btn-outline-secondary" for="slashE">E</label>

      <input type="radio" class="btn-check" name="slashNote" id="slashF" value="F">
      <label class="btn btn-outline-secondary" for="slashF">F</label>

      <input type="radio" class="btn-check" name="slashNote" id="slashG" value="G">
      <label class="btn btn-outline-secondary" for="slashG">G</label>

      <input type="radio" class="btn-check" name="slashNote" id="slashA" value="A">
      <label class="btn btn-outline-secondary" for="slashA">A</label>

      <input type="radio" class="btn-check" name="slashNote" id="slashB" value="B">
      <label class="btn btn-outline-secondary" for="slashB">B</label>

    </div>
  </div>

  <!-- GRIP SPAN -->
  <div class="mb-3">
    <label class="form-label">Grip Span</label>
    <input class="form-control" type="number" value="3" min="1" max="12" id="gripSpanInput">
  </div>

  <!-- BUTTON -->
  <div class="text-center">
    <button class="btn btn-primary" onclick="ExploreChord()">Explore Chord</button>
  </div>
</div>


    <!-- ===================== -->
    <!-- FRETBOARD (CENTER) -->
    <!-- ===================== -->
    <div class="fretboard-outer mb-4">
      <div class="fretboard-inner border-top border-bottom py-4 bg-body-tertiary">

        <div class="d-flex gap-2 mb-3 justify-content-end px-2">
          <button class="btn btn-outline-secondary square-btn d-none" id="resetButton"></button>

          <button class="btn btn-outline-secondary square-btn" id="playSoundButton">
            <!-- SVG stays same -->
          </button>
        </div>

        <div id="fretboardWrapper">
          <div id="fretboardContainer"></div>
        </div>

      </div>
    </div>


    <!-- ===================== -->
    <!-- BOTTOM (RESPONSIVE) -->
    <!-- ===================== -->
    <div class="row w-100">

      <!-- GRIPS -->
      <div class="col-12 col-md-6 mb-3">
        <div class="border rounded p-3 h-100">
          <h5 class="text-center mb-3">Found Grips</h5>

          <div id="possibleGrips" class="d-flex flex-column align-items-center gap-2 w-100">
            <p class="text-muted text-center mb-1">Enter a chord in the selector</p>
          </div>
        </div>
      </div>

      <!-- SETTINGS -->
      <div class="col-12 col-md-6 mb-3">
        <div class="border rounded p-3 h-100">
          <h5 class="text-center mb-3">Guitar Settings</h5>

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
    /* Fretboard responsive behavior */
.fretboard-outer {
  width: 100%;
  display: flex;
  justify-content: center;
}

.fretboard-inner {
  width: max-content;
  max-width: 100%;
  overflow-x: auto;
}

/* Square buttons */
.square-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Grips styling */
#possibleGrips > * {
  width: 100%;
  text-align: center;
  cursor: pointer;
}
</style>

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

    function getRadioMidis() {
        const radios = document.querySelectorAll('input.fretboardRadio');
        const groupNames = [...new Set([...radios].map(r => r.name))];
        return groupNames.map(name => {
            const checked = document.querySelector(`input[name="${name}"]:checked`);
            return checked ? checked.dataset.midi : "x";
        }).reverse();
    }

    document.getElementById('playSoundButton').addEventListener('click', () => {
        midiNotes = getRadioMidis();
        console.log("Playing notes with MIDI values:", midiNotes);
        console.log("Corresponding note names:", midiNotes.map(midi => midi === "x" ? ["x", 0] : [NoteUtilities.getNoteName(midi),NoteUtilities.getOctave(midi)]));

        const notesWithOctaves = midiNotes.map(midi => midi === "x" ? ["x", 0] : [NoteUtilities.getNoteName(midi),NoteUtilities.getOctave(midi)]);
        PlayChord(notesWithOctaves);
    });
</script>



<?php
$content = ob_get_clean();

require __DIR__ . '/../../layouts/template.php';