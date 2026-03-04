
const tritones =
{
    maj: [1, 5, 8],
    min: [1, 4, 8],
    sus2: [1, 3, 8],
    sus4: [1, 6, 8],
    '5': [1, 8],
    dim: [1, 4, 7],
    aug: [1, 5, 9]
}

const addDictionary =
{
    'm2':2,
    'M2':3,
    'm3':4,
    'M3':5,
    '4':6,
    'A4':7,
    'D5':7,
    '5':8,
    'm6':9,
    'M6':10,
    'm7':11,
    'M7':12
}

const allNotes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

const fretboardLength = 24;

let NotesInChord = [];
let chordFretsOnStrings = [];
let chordNotesOnStrings = [];

function ChordToGrips(mainInput)
{
    const inputjson = JSON.parse(mainInput);

    const root = inputjson.root;
    const tri = inputjson.tri;
    const add = inputjson.add;
    const slash = inputjson.slash;

    const gripSpan = inputjson.gripSpan;
    const tuning = inputjson.tuning;
    const fretboard = MakeFretMatrix(tuning);

    chordFretsOnStrings = [];
    chordNotesOnStrings = [];
    
    fullchordgrips = [];
    fullchordnotes = [];

    console.clear();

    ChordToNotes(root, tri, add, slash);


    if (tuning.length - (NotesInChord.length) >= 0)
    {
        FindNotesOnStrings(fretboard, tuning, root, tri, add, slash);
    }
    else
    {
        //több hang mint húr :P

        console.log("F");
    }
    ChordGeneratorCaller();
    const finalgripsandnotes = TestChordNotes(chordNotesOnStrings[0], [fullchordgrips, fullchordnotes], gripSpan);

    return JSON.stringify(finalgripsandnotes[0]);
    
}

function MakeFretMatrix(tuning)
{
    let fretboard = [];
    
    for (let k = 0; k < tuning.length; k++) 
    {
        let string = [];
        string.push(tuning[k]);
        for (let j = 0; j < fretboardLength; j++)
        {
            let noteIndex = allNotes.indexOf(string[j]);
            if (noteIndex >= 11)
            {
                noteIndex = -1;
            }
            string.push(allNotes[noteIndex + 1]);
            
        }
        fretboard.push(string);
    }

    return fretboard;
}

function ChordToNotes(root, tri, add, slash)
{
    const rootIndex = allNotes.indexOf(root);

    let chordReativeDistance = [];

    const noteIndexes = [...tritones[tri]];

    let addRelativeDistance = "";

    if (add != "")
    {
        addRelativeDistance = add.split(", ");
        for (let k = 0; k < addRelativeDistance.length; k++) 
        {
            if(!noteIndexes.includes(addDictionary[addRelativeDistance[k]]))
            {
                noteIndexes.push(addDictionary[addRelativeDistance[k]])
            }
           
        }
    }
 
    for (let i = 0; i < noteIndexes.length; i++) 
    {
        let tempChordRelDist = noteIndexes[i] - 1 + rootIndex;
        if (allNotes.length <= tempChordRelDist)
        {
            tempChordRelDist = tempChordRelDist - 12;
        }
        chordReativeDistance.push(tempChordRelDist);
        
    }

    let lowNote = "";
    if (slash != "")
    {
        lowNote = slash;
    }
    else
    {
        lowNote = root;
    }

    NotesInChord = [lowNote];
    for (let l = 0; l < chordReativeDistance.length; l++) 
    {
        if (allNotes[chordReativeDistance[l]] != lowNote)
        {
            NotesInChord.push(allNotes[chordReativeDistance[l]]);
        }
    }
    
    console.log(NotesInChord, lowNote)
}

function FindNotesOnStrings(fretboard, tuning, root, tri, add, slash)
{
    chordFretsOnStrings = [];
    chordNotesOnStrings = [];

    for (let i = tuning.length; i > 0; i--) {
        let chordFretsOnString = []
        let chordNotesOnString = [];
  
        for (let j = 0; j < NotesInChord.length; j++)
        {
            const fret = fretboard[i - 1].indexOf(NotesInChord[j]);

            chordFretsOnString.push(fret);
            if (NotesInChord[j] == root || NotesInChord[j] == slash)
            {
                if (NotesInChord.includes(slash))
                {
                    if (NotesInChord[j] == slash) {chordNotesOnString.push("bass")}
                    if (NotesInChord[j] == root) {chordNotesOnString.push("root")}   
                }
                else
                {
                    if (NotesInChord[j] == root) {chordNotesOnString.push("bass")}
                }
            }
            else
            {
                const tritoneIndexes = [...tritones[tri]];
                const rootIndex = allNotes.indexOf(root);
             
                let NoteFifthRelativeDistance = tritoneIndexes[2] - 1 + rootIndex;
                if (allNotes.length <= NoteFifthRelativeDistance)
                {
                    NoteFifthRelativeDistance = NoteFifthRelativeDistance - 12;
                }

                let NoteThirdRelaltiveDistance = tritoneIndexes[1] - 1 + rootIndex;
                if (allNotes.length <= NoteThirdRelaltiveDistance)
                {
                    NoteThirdRelaltiveDistance = NoteThirdRelaltiveDistance - 12;
                }

                if (NotesInChord[j] == allNotes[NoteFifthRelativeDistance] || NotesInChord[j] == allNotes[NoteThirdRelaltiveDistance])
                {
                    if (NotesInChord[j] == allNotes[NoteFifthRelativeDistance]) {chordNotesOnString.push("fifth")}
                    if (NotesInChord[j] == allNotes[NoteThirdRelaltiveDistance]) {chordNotesOnString.push("third")}
                }
                else
                {
                    chordNotesOnString.push("decor" + j);
                }

            }

        }

        chordFretsOnStrings.push(chordFretsOnString);
        chordNotesOnStrings.push(chordNotesOnString);
 

    }
        
    console.log(chordFretsOnStrings);
    console.log(chordNotesOnStrings);

}

function ChordGeneratorCaller()
{

    for (let l = chordFretsOnStrings.length - 1; l > 0; l--) 
    {
        let chordgrip = [];
        let chordnotes = [];

        if (l < chordFretsOnStrings.length - 1)
        {
            for (let i = 0; i < chordFretsOnStrings.length - 1 - l; i++) 
            {
                chordgrip.push("x");
                chordnotes.push("x");
            }
        }

        for (let i = 0; i < chordFretsOnStrings[l].length; i++) 
        {
            if (chordNotesOnStrings[l][i] == "bass")
            {
                chordgrip.push(chordFretsOnStrings[l][i]);
                chordnotes.push(chordNotesOnStrings[l][i]);
       
                
                ChordGenerator(chordFretsOnStrings, chordNotesOnStrings, l - 1, 0, chordgrip, chordnotes);
          
            }
            
        }

    }

}

function ChordGenerator(pg, gn, stringInd, fretInd, chordgrip, chordnotes)
{

    if (stringInd < 0)
    {
        fullchordgrips.push([...chordgrip]);
        fullchordnotes.push([...chordnotes]);
        return;
    }

    const frets = pg[stringInd];
    const notes = gn[stringInd];

    
    for (let i = 0; i < frets.length; i++)
    {
        const fret = frets[i];
        const noteType = notes[i];

        if (fret != 0 && fret < fretInd)
            continue;

        ChordGenerator(
            pg,
            gn,
            stringInd - 1,
            fretInd,
            [...chordgrip, fret],
            [...chordnotes, noteType]
        );
    }


}

function TestChordNotes(chordqualities, chordgripsandnotes, gripSpan)
{
    const chordgrips = chordgripsandnotes[0];
    const chordnotes = chordgripsandnotes[1];

    let newchordgrips = [];
    let newchordnotes = [];

    for (let i = 0; i < chordgrips.length; i++)
    {
        let min = 99;
        let max = 0;
        let goodQC = true;
        for (let j = 0; j < chordqualities.length; j++) 
        {
            if (!chordnotes[i].includes(chordqualities[j]) && chordnotes[i] != "x")
            {
                goodQC = false;
            }
        }
   
        for (let j = 0; j < chordgrips[i].length; j++)
        {
            if (chordgrips[i][j] < min && chordgrips[i][j] != 0 && chordgrips[i][j] != "x") {min = chordgrips[i][j]}
            if (chordgrips[i][j] > max && chordgrips[i][j] != "x") {max = chordgrips[i][j]}
        }   
        if(goodQC && max - min < gripSpan)
        {
            newchordgrips.push(chordgrips[i]);
            newchordnotes.push(chordnotes[i]);
        } 
        
    }

    return [newchordgrips, newchordnotes];
}