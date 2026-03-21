
const Tritones = {
    maj: [1, 5, 8],
    min: [1, 4, 8],
    sus2: [1, 3, 8],
    sus4: [1, 6, 8],
    '5': [1, 8],
    dim: [1, 4, 7],
    aug: [1, 5, 9],
    '': [1],
}

function MidisToChord(midiNotes)     //main function
{
    const midiUniqueNotes = getMidiUniqueNotes(midiNotes);

    const lowNote = midiNotes[0];

    const chords = [];

    for (let index = 0; index < midiUniqueNotes.length; index++) 
    {
        const inversion = midiUniqueNotes.slice(index).concat(midiUniqueNotes.slice(0, index));   //[a b c] => [b c a]
        const rootNote = inversion[0];
        const temp = MidiToRelativeDistance(inversion, lowNote);
        const relativeDistance = temp[0];
        const lowNoteRelativeDistance = temp[1];
        const tritone = DetermineTritone(relativeDistance);
        const slashNote = DetermineSlashNote(rootNote, lowNote);
        if(slashNote != "")
        {
            relativeDistance.splice(relativeDistance.indexOf(lowNoteRelativeDistance), 1);
        }
        const remainders = DetermineRemainders(relativeDistance, tritone);


        const chord = [NoteUtilities.getNoteName(rootNote), tritone, remainders, slashNote];
        chords.push(chord.join(""));
    }
    return chords;
}

function getMidiUniqueNotes(midiNotes)
{
    const seen = new Set();
    const midiUniqueNotes = []
    for (const n of midiNotes) 
    {
        const pitchClass = n % 12;
        
        if (!seen.has(pitchClass)) 
        {
            seen.add(pitchClass);
            midiUniqueNotes.push(n);
        }
    }
    return midiUniqueNotes;
}

function MidiToRelativeDistance(midiNotes, lowNote)    
{
    let lowNoteRelativeDistance = 0;
    const relativeDistance = midiNotes;
    const rootOffset = relativeDistance[0]-1;
    for (let i = 0; i < relativeDistance.length; i++)
    {
        if(relativeDistance[i] == lowNote)
        {
            relativeDistance[i] = relativeDistance[i] - rootOffset;
            relativeDistance[i] = relativeDistance[i] % 12; 
            if(relativeDistance[i] < 1)
            {
                relativeDistance[i] = relativeDistance[i] + 12;
            }
            lowNoteRelativeDistance = relativeDistance[i];
        }
        else
        {
            relativeDistance[i] = relativeDistance[i] - rootOffset;
            relativeDistance[i] = relativeDistance[i] % 12; 
            if(relativeDistance[i] < 1)
            {
                relativeDistance[i] = relativeDistance[i] + 12;
            }
        }
    }
    return  [relativeDistance, lowNoteRelativeDistance];
}


function DetermineTritone(relativeDistance)       
{
    let bestKey = "";
    let bestScore = -1;
    
    for (const [key, arr] of Object.entries(Tritones)) 
    {
        const isMatch = arr.every(x => relativeDistance.includes(x));
        if (isMatch) 
        {
            if (arr.length > bestScore) 
            {
                bestScore = arr.length;
                bestKey = key;
            }
        }
    }
    
    return bestKey;
}


function DetermineSlashNote(rootNote, lowNote)      
{
    let slashNote = "";
    if(lowNote != rootNote)
    {
        slashNote = "/" + NoteUtilities.getNoteName(lowNote);
    }
    return slashNote;
}


function DetermineRemainders(relativeDistance, tritone)      
{
    for (let index = 0; index < Tritones[tritone].length; index++)       
    {
        if(relativeDistance.includes(Tritones[tritone][index]))
        {
            const relativeTritone = relativeDistance.indexOf(Tritones[tritone][index]);
            relativeDistance.splice(relativeTritone, 1);
        }
    }

    relativeDistance.sort(function(a, b){return a - b});

    const relativeDistanceToInterval = {
        2: "m2",
        3: "M2",
        4: "m3",
        5: "M3",
        6: "4",
        7: "A4/D5",
        8: "5",
        9: "m6",
        10: "M6",
        11: "m7",
        12: "M7"
    };

    const remainderInterval = [];
      
    for (let i = 0; i < relativeDistance.length; i++) 
    {
        const value = relativeDistanceToInterval[relativeDistance[i]];
        if (value !== undefined) 
        {
            remainderInterval.push(value);
        }
    }

    let remainderTone = "Add:";
    for (let index = 0; index < remainderInterval.length; index++)
    {
        remainderTone += remainderInterval[index] + ",";   
    }
    remainderTone = remainderTone.slice(0, -1);

    if(remainderTone.length == 3)
    {
        remainderTone = "";
    }
    return remainderTone;
}
