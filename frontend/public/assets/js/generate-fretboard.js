
const Tuning = ['E', 'A', 'D', 'G', 'B', 'E'];

const NotesFlat = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const NotesSharp = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function generateFretboard(stringCount = 6, fretCount = 22) {
    const fretboardContainer = document.getElementById('fretboardContainer');
    
    // html will be inserted into fretboardContainer, elements are to be appended to this string
    let html = '';

    // Constants for fret spacing calculation
    const semitoneRatio = Math.pow(2, 1 / 12); // ≈ 1.059463094
    const k = semitoneRatio - 1;
    
    for (let i = 0; i <= fretCount; i++) { // Repeat for every fret
        // Insert a column for every fret
        if (i === 0) {
            html += `
            <div class="nut"></div>
            <div class="fretboardColumn" data-fret="${i}">`;
        } else {
            html += `
            <div class="fret"></div>
            <div class="fretboardColumn" data-fret="${i}">`;
        }

        for (let j = stringCount - 1; j >= 0; j--) { // Repeat for every string

            // Variables for fret spacing calculation
            stringTuning = Tuning[j];

            ind = NotesFlat.findIndex(note => note == stringTuning);
            note = NotesFlat[(ind + i)%NotesFlat.length];
            fretSpacing = 1000 * (1 / Math.pow(2, i / 24)) * k


            // use fretSpacing for realism
            html += `
            <div class="fretboardCell" style="width:${fretSpacing}px"> 
                <input type="radio" name="s${j}" value="${i}" id="s${j}f${i}" class="fretboardRadio">
                <label for="s${j}f${i}">
                    <div>${note}</div>
                </label>
            </div>`;
        }
        html += `</div>`;
    }
    html += `</div>`;

    fretboardContainer.innerHTML = html;
}


// Horizontal scroll with mouse wheel (prevents document scroll)
document.addEventListener('wheel', e => {
    const container = document.getElementById('fretboardWrapper');
    if (!container) return;
    
    // Check if the wheel event target is inside the fretboard container
    if (container.contains(e.target)) {
        e.preventDefault();
        if (e.deltaY !== 0) {
            container.scrollLeft += e.deltaY;
        }
    }
}, { passive: false });

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

generateFretboard(6, 24);