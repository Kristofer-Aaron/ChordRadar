const tuning = ['E', 'A', 'D', 'G', 'B', 'E'];

const notesFlat = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const notesSharp = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];


function generateFretboard(stringCount = 6, fretCount = 22) {
    const fretboardContainer = document.getElementById('fretboardContainer');
    
    // html will be inserted into fretboardContainer, elements should be appended to this string
    let html = '';


    // Main fretboard
    html += `<div class="fretboardMain">`;
    for (let i = 0; i <= fretCount; i++) {
        html += `<div class="fretboardColumn" data-fret="${i}">`;
        for (let j = 0; j < stringCount; j++) {
            stringTuning = tuning[j];
            ind = notesFlat.findIndex(note => note == stringTuning);
            note = notesFlat[(ind + i)%notesFlat.length];

            html += `
            <div class="fretboardCell">
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
    });
}

function alertValues(array) {
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
        alertValues(getRadioValues());
    }
});

// Horizontal scroll with mouse wheel
document.addEventListener('wheel', e => {
    const container = document.getElementById('fretboardWrapper');
    if (e.deltaY !== 0) {
        container.scrollLeft += e.deltaY;
        e.preventDefault();
    }
});

generateFretboard(6, 24);
