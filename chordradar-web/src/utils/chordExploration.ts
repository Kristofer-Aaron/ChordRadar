/**
 * Chord voicing generator (formerly chord-to-grips).
 * Finds playable guitar voicings for a given chord with fret-span constraint.
 * Takes a chord definition (root, triad type, additions, slash note, grip span)
 * and returns all valid fret patterns as arrays (e.g., [0, 2, 3, 1, 'x', 0]).
 *
 * Algorithm:
 * 1. Build chord notes from root + triad intervals + additions + slash note
 * 2. Map all occurrences of each chord note onto each string (fretboard matrix)
 * 3. Generate voicings by selecting one note per string
 * 4. Classify each string's role (bass, root, third, fifth, decoration)
 * 5. Filter by grip span constraint (max fret - min fret < gripSpan)
 * 6. Ensure at least one bass/root note in each voicing
 */

const TRIAD_INTERVALS: Readonly<Record<string, readonly number[]>> = {
    maj: [1, 5, 8],
    min: [1, 4, 8],
    sus2: [1, 3, 8],
    sus4: [1, 6, 8],
    '5': [1, 8],
    dim: [1, 4, 7],
    aug: [1, 5, 9],
};

const ADDED_INTERVALS: Readonly<Record<string, number>> = {
    m2: 2,
    M2: 3,
    m3: 4,
    M3: 5,
    '4': 6,
    A4: 7,
    D5: 7,
    '5': 8,
    m6: 9,
    M6: 10,
    m7: 11,
    M7: 12,
};

const ALL_NOTES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'] as const;
const FRETBOARD_LENGTH = 24;

type TriadQuality = keyof typeof TRIAD_INTERVALS;
type StringRole = 'bass' | 'root' | 'third' | 'fifth' | `decor${number}` | 'x';

export type ChordVoicingInput = {
    root: string;
    triad: TriadQuality;
    add: string;
    slash: string;
    gripSpan: number;
    tuning: readonly string[];
};

export type ChordVoicing = Array<number | 'x'>;

type NoteSearchState = {
    notesInChord: string[];
    chordFretsOnStrings: number[][];
    chordNotesOnStrings: StringRole[][];
};

function makeFretMatrix(tuning: readonly string[]): string[][] {
    return tuning.map((openNote) => {
        const stringNotes = [openNote];

        for (let fret = 0; fret < FRETBOARD_LENGTH; fret++) {
            let noteIndex = ALL_NOTES.indexOf(stringNotes[fret] as (typeof ALL_NOTES)[number]);
            if (noteIndex >= ALL_NOTES.length - 1) {
                noteIndex = -1;
            }

            stringNotes.push(ALL_NOTES[noteIndex + 1]);
        }

        return stringNotes;
    });
}

function buildChordNotes(root: string, triad: TriadQuality, add: string, slash: string): string[] {
    const rootIndex = ALL_NOTES.indexOf(root as (typeof ALL_NOTES)[number]);
    const noteIndexes = [...TRIAD_INTERVALS[triad]];

    if (add !== '') {
        for (const intervalName of add.split(', ').filter(Boolean)) {
            const interval = ADDED_INTERVALS[intervalName];
            if (interval !== undefined && !noteIndexes.includes(interval)) {
                noteIndexes.push(interval);
            }
        }
    }

    const chordRelativeDistances = noteIndexes.map((interval) => {
        let noteIndex = interval - 1 + rootIndex;
        if (noteIndex >= ALL_NOTES.length) {
            noteIndex -= 12;
        }
        return noteIndex;
    });

    const lowNote = slash || root;
    const notesInChord = [lowNote];

    for (const noteIndex of chordRelativeDistances) {
        const note = ALL_NOTES[noteIndex];
        if (note !== lowNote) {
            notesInChord.push(note);
        }
    }

    return notesInChord;
}

function classifyNoteRole(note: string, notesInChord: readonly string[], root: string, triad: TriadQuality, slash: string, noteIndex: number): StringRole {
    if (note === root || note === slash) {
        if (notesInChord.includes(slash)) {
            if (note === slash) {
                return 'bass';
            }
            if (note === root) {
                return 'root';
            }
        } else if (note === root) {
            return 'bass';
        }
    }

    const triadIntervals = [...TRIAD_INTERVALS[triad]];
    const rootIndex = ALL_NOTES.indexOf(root as (typeof ALL_NOTES)[number]);

    let fifthIndex = triadIntervals[2] - 1 + rootIndex;
    if (fifthIndex >= ALL_NOTES.length) {
        fifthIndex -= 12;
    }

    let thirdIndex = triadIntervals[1] - 1 + rootIndex;
    if (thirdIndex >= ALL_NOTES.length) {
        thirdIndex -= 12;
    }

    if (note === ALL_NOTES[fifthIndex]) {
        return 'fifth';
    }

    if (note === ALL_NOTES[thirdIndex]) {
        return 'third';
    }

    return `decor${noteIndex}`;
}

function findNotesOnStrings(
    fretboard: readonly string[][],
    tuning: readonly string[],
    notesInChord: readonly string[],
    root: string,
    triad: TriadQuality,
    add: string,
    slash: string,
): Pick<NoteSearchState, 'chordFretsOnStrings' | 'chordNotesOnStrings'> {
    void tuning;
    void add;

    const chordFretsOnStrings: number[][] = [];
    const chordNotesOnStrings: StringRole[][] = [];

    for (let stringIndex = fretboard.length; stringIndex > 0; stringIndex--) {
        const stringFrets: number[] = [];
        const stringRoles: StringRole[] = [];

        for (let noteIndex = 0; noteIndex < notesInChord.length; noteIndex++) {
            const note = notesInChord[noteIndex];
            stringFrets.push(fretboard[stringIndex - 1].indexOf(note));
            stringRoles.push(classifyNoteRole(note, notesInChord, root, triad, slash, noteIndex));
        }

        chordFretsOnStrings.push(stringFrets);
        chordNotesOnStrings.push(stringRoles);
    }

    return { chordFretsOnStrings, chordNotesOnStrings };
}

function generateVoicingsFromBass(
    fretsByString: readonly number[][],
    rolesByString: readonly StringRole[][],
): [ChordVoicing[], StringRole[][]] {
    const fullVoicings: ChordVoicing[] = [];
    const fullRoles: StringRole[][] = [];

    function expand(
        stringIndex: number,
        fretFloor: number,
        voicing: ChordVoicing,
        roles: StringRole[],
    ): void {
        if (stringIndex < 0) {
            fullVoicings.push([...voicing]);
            fullRoles.push([...roles]);
            return;
        }

        const frets = fretsByString[stringIndex];
        const noteRoles = rolesByString[stringIndex];

        for (let index = 0; index < frets.length; index++) {
            const fret = frets[index];
            const role = noteRoles[index];

            if (fret !== 0 && fret < fretFloor) {
                continue;
            }

            expand(stringIndex - 1, fretFloor, [...voicing, fret], [...roles, role]);
        }
    }

    for (let stringIndex = fretsByString.length - 1; stringIndex > 0; stringIndex--) {
        let startingVoicing: ChordVoicing = [];
        let startingRoles: StringRole[] = [];

        if (stringIndex < fretsByString.length - 1) {
            for (let mutedCount = 0; mutedCount < fretsByString.length - 1 - stringIndex; mutedCount++) {
                startingVoicing.push('x');
                startingRoles.push('x');
            }
        }

        for (let roleIndex = 0; roleIndex < fretsByString[stringIndex].length; roleIndex++) {
            if (rolesByString[stringIndex][roleIndex] !== 'bass') {
                continue;
            }

            startingVoicing = [...startingVoicing, fretsByString[stringIndex][roleIndex]];
            startingRoles = [...startingRoles, rolesByString[stringIndex][roleIndex]];
            expand(stringIndex - 1, 0, startingVoicing, startingRoles);
            startingVoicing = startingVoicing.slice(0, -1);
            startingRoles = startingRoles.slice(0, -1);
        }
    }

    return [fullVoicings, fullRoles];
}

function filterVoicings(requiredRoles: readonly StringRole[], voicings: readonly ChordVoicing[], roles: readonly StringRole[][], gripSpan: number): ChordVoicing[] {
    const filtered: ChordVoicing[] = [];

    for (let index = 0; index < voicings.length; index++) {
        let minFret = 99;
        let maxFret = 0;
        let hasAllRequiredRoles = true;

        for (const requiredRole of requiredRoles) {
            if (!roles[index].includes(requiredRole)) {
                hasAllRequiredRoles = false;
                break;
            }
        }

        if (!hasAllRequiredRoles) {
            continue;
        }

        for (const fret of voicings[index]) {
            if (fret !== 0 && fret !== 'x' && fret < minFret) {
                minFret = fret;
            }
            if (fret !== 'x' && fret > maxFret) {
                maxFret = fret;
            }
        }

        if (maxFret - minFret < gripSpan) {
            filtered.push(voicings[index]);
        }
    }

    return filtered;
}

export function generateChordVoicings(input: ChordVoicingInput): ChordVoicing[] {
    const notesInChord = buildChordNotes(input.root, input.triad, input.add, input.slash);
    if (input.tuning.length - notesInChord.length < 0) {
        return [];
    }

    const fretboard = makeFretMatrix(input.tuning);
    const { chordFretsOnStrings, chordNotesOnStrings } = findNotesOnStrings(
        fretboard,
        input.tuning,
        notesInChord,
        input.root,
        input.triad,
        input.add,
        input.slash,
    );

    const [voicings, roles] = generateVoicingsFromBass(chordFretsOnStrings, chordNotesOnStrings);
    return filterVoicings(chordNotesOnStrings[0] ?? [], voicings, roles, input.gripSpan);
}
