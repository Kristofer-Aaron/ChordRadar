
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
        html += `
        <div class="fret"></div>
        <div class="fretboardColumn" data-fret="${i}">`;

        for (let j = stringCount - 1; j >= 0; j--) { // Repeat for every string

            // Variables for fret spacing calculation
            stringTuning = Tuning[j];

            ind = NotesFlat.findIndex(note => note == stringTuning);
            note = NotesFlat[(ind + i)%NotesFlat.length];
            fretSpacing = 1800 * (1 / Math.pow(2, i / 12)) * k


            // use fretSpacing for realism
            html += `
            <div class="fretboardCell" style="width:${40}px"> 
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



function getRadioValues() {
    const radios = document.querySelectorAll('input.fretboardRadio');
    const groupNames = [...new Set([...radios].map(r => r.name))];
    return groupNames.map(name => {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        return checked ? checked.value : "x";
    }).reverse();
}



function logValues(array) {
    console.log(array.join(" "));
}



// Toggle/uncheck radio buttons
document.addEventListener('click', e => {
    if (e.target.classList.contains("fretboardRadio")) {
        const radio = e.target;
        const group = document.getElementsByName(radio.name);
        if (radio.wasChecked) {
            radio.checked = false;
        }

        group.forEach(r => r.wasChecked = r.checked);
        logValues(getRadioValues());
        chords = GripToChord(getRadioValues(), Tuning, NotesFlat);
        console.log(chords);
        document.getElementById("possibleChords").textContent = "Possible chords: " + chords.join(", ");
    }
});



// Horizontal scroll with mouse wheel
document.addEventListener('wheel', e => {
    const container = document.getElementById('fretboardWrapper');
    if (e.deltaY !== 0 && container.matches(':hover')) {
        container.scrollLeft += e.deltaY;
        e.preventDefault();
    }
});

document.getElementById('resetButton').addEventListener('click', () => {
    const radios = document.querySelectorAll('input.fretboardRadio');

    radios.forEach(radio => {
        radio.checked = false;
        radio.wasChecked = false;
    });

    logValues(getRadioValues());
    document.getElementById("possibleChords").textContent = "Possible chords: ";
}, { passive: true });

generateFretboard(6, 24);


