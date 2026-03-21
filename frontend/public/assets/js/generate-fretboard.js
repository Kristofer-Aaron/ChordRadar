
function generateFretboard(stringCount = 6, fretCount = 22) {
    const fretboardContainer = document.getElementById('fretboardContainer');
    
    // html will be inserted into fretboardContainer, elements are to be appended to this string
    let html = '';

    // Constants for fret spacing calculation
    const semitoneRatio = Math.pow(2, 1 / 12); // ≈ 1.059463094
    const k = semitoneRatio - 1;
    
    const tuning = NoteUtilities.tuning;

    for (let i = 0; i <= fretCount; i++) { // Repeat for every fret
        // Insert a column for every fret

        html += `<div class="fretboardColumn" data-fret="${i}">`
        
        for (let j = stringCount - 1; j >= 0; j--) { // Repeat for every string
            midiNote = tuning[j] + i;

            noteName = NoteUtilities.getNoteName(midiNote);
            noteRender = NoteUtilities.getNoteRender(midiNote);

            fretSpacing = 2000 * (1 / Math.pow(2, i / 24)) * k;

            // use fretSpacing for realism
            html += `
            <div class="fretboardCell" style="width:${i === 0 ? "40" : fretSpacing}px"> 
                <input type="radio" name="s${j}" value="${i}" id="s${j}f${i}" class="fretboardRadio" data-midi="${midiNote}" data-note="${noteName}">
                <label for="s${j}f${i}">
                    <div>${noteRender}</div>
                </label>
            </div>`;
        }
        html += `</div><div class="${i === 0 ? "nut" : "fret"}"></div>`;
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
            container.scrollLeft += e.deltaY + e.deltaX;
        }
    }
}, { passive: false });

if (document.getElementById('playSoundButton')) {

}

generateFretboard(6, 24);