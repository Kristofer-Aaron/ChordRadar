
var Tuning = ["E", "A", "D", "G", "B", "E"]
var AllNotes= ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];

const Tritones = {
    maj: [1, 5, 8],
    min: [1, 4, 8],
    sus2: [1, 3, 8],
    sus4: [1, 6, 8],
    '5': [1, 8],
    dim: [1, 4, 7],
    aug: [1, 5, 9],
}



function GripToChord(grip, tuning, allNotes)
{
    Tuning = tuning;
    AllNotes = allNotes;
 
    notes = GripToNotes(grip);

    lownote = notes[0];
    notes = [...new Set(notes)];
    
    for (let index = 0; index < notes.length; index++) 
    {
        rotated = RotateForRootnote(notes, index);
        basenote = rotated[0];
        relativeDistance = NotesToRelativeDistance(rotated);
        tritone = DetermineTritone(relativeDistance);
        remainders = DetermineRemainders(relativeDistance, tritone);
        slashChords = DetermineSlashchords(basenote, lownote);

        chord = [basenote, tritone, remainders, slashChords];

        console.log(chord);   
    }
}



function GripToNotes(pat)   //pattern to notes
{
    nic = [];   //notes in chord
    let i=0;
    while(i < pat.length)
    {
        if(pat[i] != "x")
        {
            stringtoindex = AllNotes.findIndex(el => el === tuning[i]);
            temp = parseInt(stringtoindex) + parseInt(pat[i]);
            if(temp > 11)
            {
                temp = temp-12;
            }
            if(temp > 11)
            {
                temp = temp-12;
            }
            nic.push(AllNotes[temp]);
        }
        i++;
    }
    return nic;
}


function NotesToRelativeDistance(notes)     //notes to relatve distance
{
    relativeDistance = [];
    for (let index = 0; index < notes.length; index++)
    {
        relativeDistance.push(AllNotes.findIndex(el => el === notes[index]));
    }
    rootoffset = relativeDistance[0]-1;
    for (let index = 0; index < relativeDistance.length; index++)
    {
        relativeDistance[index] = relativeDistance[index] - rootoffset;
        if(relativeDistance[index] < 1)
        {
            relativeDistance[index] = relativeDistance[index] + 12;
        }
    }
    return relativeDistance;
}

function DetermineTritone(relativeDistance)       //determine tritone
{
    let bestKey = null;
    let maxCommon = -1;

    for (const [key, arr] of Object.eNotesToRelativeDistanceies(Tritones)) {
        const common = arr.filter(x => relativeDistance.includes(x)).length;
        if (common > maxCommon) {
            maxCommon = common;
            bestKey = key;
        }
    }
    return bestKey;
}

function DetermineRemainders(RelDisc, tritone)      //determine remainders
{
    for (let index = 0; index < Tritones[tritone].length; index++)       
    {
        if(RelDisc.includes(Tritones[tritone][index]))
        {
            const tri = RelDisc.indexOf(Tritones[tritone][index]);
            RelDisc.splice(tri, 1);            //getting remainders outside of tritone
        }
    }

    RelDisc.sort(function(a, b){return a - b});

    var StToInt = [[2, "m2"], [3, "M2"], [4, "m3"], [5, "M3"], [6, "4"], [7, "A4/D5"], [8, "5"], [9, "m6"], [10, "M6"], [11, "m7"], [12, "M7"]];

    let remainderInterval = [];
    for (let index = 0; index < RelDisc.length; index++) 
    {
        for (let k = 0; k < StToInt.length; k++)
        {
            if(RelDisc[index] == StToInt[k][0])
            {
                remainderInterval.push(StToInt[k][1]);
            }
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

function DetermineSlashchords(basenote, lownote)      //determine if slashchorDetermineSlashchords
{
    let slash = "";
    if(lownote != basenote)
    {
        slash = "/" + lownote;
    }
    return slash;
}

function RotateForRootnote(notes, index)      //rotate for rootnote
{
    const rotated = notes.slice(index).concat(notes.slice(0, index));
    return rotated;
}
