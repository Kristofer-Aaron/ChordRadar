class FretboardRenderer {
    constructor(containerId, stringCount = 6, fretCount = 24) {
        this.container = document.getElementById(containerId);
        this.stringCount = stringCount;
        this.fretCount = fretCount;
        this.scaleLength = 650;
    }

    // Calculate spacing between frets
    getFretSpacing(fret) {
        const pos = this.scaleLength - this.scaleLength / Math.pow(2, fret / 12);
        const prev = fret === 0 ? 0 :
            this.scaleLength - this.scaleLength / Math.pow(2, (fret - 1) / 12);
        return pos - prev;
    }

    generate() {
        let fretboardContainer = `
            <div class="d-grid" style="
            grid-template-columns: 160px 20px 10px);
            ">`;

    for (let string = 0; string < this.stringCount; string++) {
        const tuningSelect = `
            <div class="input-group tuningCell bg-body-tertiary py-1 px-2">
                <button class="btn btn-outline-secondary" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash" viewBox="0 0 16 16">
                        <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>
                    </svg>
                </button>
                <select class="form-select" data-string="${string}">
                    ${Object.keys(NoteUtilities.sharpNoteMap)
                        .map(note => `<option value="${note}" ${NoteUtilities.getMidiNote(note, 2) === NoteUtilities.tuning[string] ? 'selected' : ''}>${note}</option>`)
                        .join('')}
                </select>
                <button class="btn btn-outline-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                    </svg>          
                </button>
            </div>
        `.trim();

        fretboardContainer += tuningSelect;

        // Add the collapse button only once
        if (string === 0) {
            fretboardContainer += `
                <div class="tuningSelectorCollapse bg-body-tertiary" style="grid-row: 1 / -1; grid-column: 2;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-left-fill" viewBox="0 0 16 16">
                        <path d="m3.86 8.753 5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z"/>
                    </svg>
                </div>
            `;
        }

        fretboardContainer += `<div class="bg-primary" data-string="${string}"></div>`;
    }

    fretboardContainer += '</div>'; // close d-grid

    this.container.innerHTML = fretboardContainer;
}
    }

fretboardRenderer = new FretboardRenderer('fretboardContainer');
fretboardRenderer.generate();