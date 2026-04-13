/**
 * NoteUtilities - MIDI note name and frequency utilities
 *
 * Static helper class for converting between MIDI note numbers (0-127), Western note
 * names (C, C#, D, etc. or Db, D, Eb, etc.), octaves, and frequencies in Hz.
 *
 * Standard tuning: EADGBE = [40, 45, 50, 55, 59, 64] MIDI.
 * Maps note names (sharp or flat) ↔ semitone offsets → MIDI numbers & frequencies.
 * Used by fretboard, analysis, synthesis, and voicing generation.
 */

type SharpNoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
type FlatNoteName = 'C' | 'Db' | 'D' | 'Eb' | 'E' | 'F' | 'Gb' | 'G' | 'Ab' | 'A' | 'Bb' | 'B';
type NoteName = SharpNoteName | FlatNoteName;

const SHARP_NOTE_NAMES: readonly SharpNoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTE_NAMES: readonly FlatNoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export class NoteUtilities {
    static readonly sharpNoteMap: Readonly<Record<SharpNoteName, number>> = {
        'C': 0,
        'C#': 1,
        'D': 2,
        'D#': 3,
        'E': 4,
        'F': 5,
        'F#': 6,
        'G': 7,
        'G#': 8,
        'A': 9,
        'A#': 10,
        'B': 11,
    };

    static readonly flatNoteMap: Readonly<Record<FlatNoteName, number>> = {
        'C': 0,
        'Db': 1,
        'D': 2,
        'Eb': 3,
        'E': 4,
        'F': 5,
        'Gb': 6,
        'G': 7,
        'Ab': 8,
        'A': 9,
        'Bb': 10,
        'B': 11,
    };

    // Standard EADGBE tuning in MIDI note numbers.
    static readonly tuning: readonly number[] = [40, 45, 50, 55, 59, 64];

    static getMidiNote(noteName: NoteName, octave: number): number;
    static getMidiNote(noteName: string, octave?: number): number | null;
    static getMidiNote(noteName: string, octave = 0): number | null {
        if (noteName in this.sharpNoteMap) {
            const semitone = this.sharpNoteMap[noteName as SharpNoteName];
            return semitone + (octave + 1) * 12;
        }

        if (noteName in this.flatNoteMap) {
            const semitone = this.flatNoteMap[noteName as FlatNoteName];
            return semitone + (octave + 1) * 12;
        }

        console.error(`Invalid note name: ${noteName}`);
        return null;
    }

    static getNoteName(midiNote: number, sharp = true): string | null {
        if (!this.isValidMidiNote(midiNote)) {
            console.error(`Invalid MIDI note number: ${midiNote}`);
            return null;
        }

        const noteNumber = midiNote % 12;
        return sharp ? SHARP_NOTE_NAMES[noteNumber] : FLAT_NOTE_NAMES[noteNumber];
    }

    static getNoteRender(midiNote: number, sharp = true): string | null {
        const noteName = this.getNoteName(midiNote, sharp);
        const octave = this.getOctave(midiNote);

        if (noteName === null || octave === null) {
            return null;
        }

        return `${noteName}<sup>${octave}</sup>`;
    }

    static getOctave(midiNote: number): number | null {
        if (!this.isValidMidiNote(midiNote)) {
            console.error(`Invalid MIDI note number: ${midiNote}`);
            return null;
        }

        return Math.floor(midiNote / 12) - 1;
    }

    static getFrequency(midiNote: number): number | null {
        if (!this.isValidMidiNote(midiNote)) {
            console.error(`Invalid MIDI note number: ${midiNote}`);
            return null;
        }

        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }

    private static isValidMidiNote(midiNote: number): boolean {
        return Number.isInteger(midiNote) && midiNote >= 0 && midiNote <= 127;
    }
}

export default NoteUtilities;