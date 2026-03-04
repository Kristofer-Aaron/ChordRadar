class NoteUtilities {
    static sharpNoteMap = {
        "C": 0,
        "C#": 1,
        "D": 2,
        "D#": 3,
        "E": 4,
        "F": 5,
        "F#": 6,
        "G": 7,
        "G#": 8,
        "A": 9,
        "A#": 10,
        "B": 11
    };

    static flatNoteMap = {
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
        'B': 11
    };

    static tuning = [
        this.getMidiNote('E', 2),
        this.getMidiNote('A', 2),
        this.getMidiNote('D', 3),
        this.getMidiNote('G', 3),
        this.getMidiNote('B', 3),
        this.getMidiNote('E', 4)
    ];

    static getNoteName(midiNote, sharp = true) {
        if (midiNote < 0 || midiNote > 127) {
            console.error(`Invalid MIDI note number: ${midiNote}`);
            return null;
        }

        const noteNumber = midiNote % 12;
        const octave = Math.floor(midiNote / 12) - 1;

        if (sharp) {
            const noteNames = Object.keys(this.sharpNoteMap);
            return noteNames[noteNumber] + octave;
        } else {
            const noteNames = Object.keys(this.flatNoteMap);
            return noteNames[noteNumber] + octave;
        }
    }

    static getOctave(midiNote) {
        if (midiNote < 0 || midiNote > 127) {
            console.error(`Invalid MIDI note number: ${midiNote}`);
            return null;
        }

        return Math.floor(midiNote / 12) - 1;
    }

    static getFrequency(midiNote) {
        if (midiNote < 0 || midiNote > 127) {
            console.error(`Invalid MIDI note number: ${midiNote}`);
            return null;
        }

        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }

    static getMidiNote(noteName, octave = 0) {
        if (this.SharpNoteMap[noteName] !== undefined) {
            return this.SharpNoteMap[noteName] + (octave + 1) * 12;
        } else if (this.FlatNoteMap[noteName] !== undefined) {
            return this.FlatNoteMap[noteName] + (octave + 1) * 12;
        }
        console.error(`Invalid note name: ${noteName}`);
        return null;
    }
}