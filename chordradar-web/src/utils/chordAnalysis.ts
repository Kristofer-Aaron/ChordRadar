/**
 * Chord analysis utility for detecting chord names from MIDI notes.
 * Uses interval-based matching to identify chord quality (maj, min, dim, aug, etc.),
 * added intervals (M7, m7, 9), and slash notation (bass notes different from root).
 *
 * Algorithm:
 * 1. Get unique pitch classes from MIDI notes
 * 2. Convert to relative intervals from lowest note
 * 3. Match against known tritone patterns (maj, min, sus2, sus4, 5, dim, aug)
 * 4. Extract remaining intervals as additions (M7, m7, 9, etc.)
 * 5. Determine slash note if bass note differs from root
 */

import { NoteUtilities } from './noteUtilities';

const TRITONES: Readonly<Record<string, readonly number[]>> = {
    maj: [1, 5, 8],
    min: [1, 4, 8],
    sus2: [1, 3, 8],
    sus4: [1, 6, 8],
    '5': [1, 8],
    dim: [1, 4, 7],
    aug: [1, 5, 9],
    '': [1],
};

function getMidiUniqueNotes(midiNotes: readonly number[]): number[] {
    const seen = new Set<number>();
    const midiUniqueNotes: number[] = [];

    for (const midiNote of midiNotes) {
        const pitchClass = midiNote % 12;

        if (seen.has(pitchClass)) {
            continue;
        }

        seen.add(pitchClass);
        midiUniqueNotes.push(midiNote);
    }

    return midiUniqueNotes;
}

function midiToRelativeDistance(midiNotes: readonly number[], lowNote: number): [number[], number] {
    let lowNoteRelativeDistance = 0;
    const relativeDistance = [...midiNotes];
    const rootOffset = relativeDistance[0] - 1;

    for (let index = 0; index < relativeDistance.length; index++) {
        let next = (relativeDistance[index] - rootOffset) % 12;
        if (next < 1) {
            next += 12;
        }

        relativeDistance[index] = next;
        if (midiNotes[index] === lowNote) {
            lowNoteRelativeDistance = next;
        }
    }

    return [relativeDistance, lowNoteRelativeDistance];
}

function determineChordQuality(relativeDistance: readonly number[]): string {
    let bestKey = '';
    let bestScore = -1;

    for (const [key, notes] of Object.entries(TRITONES)) {
        const isMatch = notes.every((note) => relativeDistance.includes(note));
        if (!isMatch) {
            continue;
        }

        if (notes.length > bestScore) {
            bestScore = notes.length;
            bestKey = key;
        }
    }

    return bestKey;
}

function determineSlashNote(rootNote: number, lowNote: number): string {
    if (lowNote === rootNote) {
        return '';
    }

    const noteName = NoteUtilities.getNoteName(lowNote);
    return noteName ? `/${noteName}` : '';
}

function determineRemainders(relativeDistance: number[], tritone: string): string {
    const tritoneSteps = TRITONES[tritone] ?? [];
    for (const step of tritoneSteps) {
        const index = relativeDistance.indexOf(step);
        if (index !== -1) {
            relativeDistance.splice(index, 1);
        }
    }

    relativeDistance.sort((a, b) => a - b);

    const relativeDistanceToInterval: Readonly<Record<number, string>> = {
        2: 'm2',
        3: 'M2',
        4: 'm3',
        5: 'M3',
        6: '4',
        7: 'A4/D5',
        8: '5',
        9: 'm6',
        10: 'M6',
        11: 'm7',
        12: 'M7',
    };

    const remainderInterval = relativeDistance
        .map((value) => relativeDistanceToInterval[value])
        .filter((value): value is string => Boolean(value));

    if (remainderInterval.length === 0) {
        return '';
    }

    return `Add:${remainderInterval.join(',')}`;
}

export function midisToChords(midiNotes: readonly number[]): string[] {
    if (midiNotes.length === 0) {
        return [];
    }

    const midiUniqueNotes = getMidiUniqueNotes(midiNotes);
    const lowNote = Math.min(...midiNotes);
    const chords: string[] = [];

    for (let index = 0; index < midiUniqueNotes.length; index++) {
        const inversion = midiUniqueNotes.slice(index).concat(midiUniqueNotes.slice(0, index));
        const rootNote = inversion[0];

        const [relativeDistance, lowNoteRelativeDistance] = midiToRelativeDistance(inversion, lowNote);
        const tritone = determineChordQuality(relativeDistance);
        const slashNote = determineSlashNote(rootNote, lowNote);

        if (slashNote !== '') {
            const lowIndex = relativeDistance.indexOf(lowNoteRelativeDistance);
            if (lowIndex !== -1) {
                relativeDistance.splice(lowIndex, 1);
            }
        }

        const remainders = determineRemainders(relativeDistance, tritone);
        const rootName = NoteUtilities.getNoteName(rootNote) ?? '';
        chords.push(`${rootName}${tritone}${remainders}${slashNote}`);
    }

    return chords;
}
