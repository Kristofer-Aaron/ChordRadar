
   // document.getElementById("root").value = "E";
   // document.getElementById("tri").value = "maj";

//tuning= ["E", "A", "D", "G", "B", "E"];

const tritones = 
{
    maj: [1, 5, 8],
    min: [1, 4, 8],
    sus2: [1, 3, 8],
    sus4: [1, 6, 8],
    '5': [1, 8],
    dim: [1, 4, 7],
    aug: [1, 5, 9],
}

const addDict = 
{
    "m2":2,
    "M2":3,
    "m3":4,
    "M3":5,
    "4":6,
    "A4":7,
    "D5":7,
    "5":8,
    "m6":9,
    "M6":10,
    "m7":11,
    "M7":12,
}

const allnotes= ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];

var root = "";
var tri = "";
var add = "";
var slash = "";

NotesInChord = [];
lownote = "";


fretboardLength = 24;
fretboard = [];

possible_grips = [];
gripnotes = [];

fullchordgrips = [];
fullchordnotes = [];

biggus_handus = 3;



/*
----------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------
                                         /\                     | |   
                                        /  \   _ __   ___   ___ | | __
                                       / /\ \ | '_ \ / _ \ / _ \| |/ /
                                      / ____ \| | | | (_) | (_) |   < 
                                     /_/    \_\_| |_|\___/ \___/|_|\_\
----------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------
                                  


something like this should be at your end:

            const dzseszon = 
            {
                root:"E",
                tri:"maj",
                add:"",
                slash:"",
                gripSpan:"3",
                tuning: ["E", "A", "D", "G", "B", "E"],
            }

            const output = ChordToGrips(JSON.stringify(dzseszon));
            console.log(JSON.parse(output));

----------------------------------------------------------------------------------------------------------
"root" can get these values: ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"]
("allnotes" variable)
----------------------------------------------------------------------------------------------------------
"tri" can get these values:
    maj
    min
    sus2
    sus4
    '5'
    dim
    aug
("tritones" variable)
----------------------------------------------------------------------------------------------------------
"add" can get these values:
    "m2"
    "M2"
    "m3"
    "M3"
    "4"
    "A4"
    "D5"
    "5"
    "m6"
    "M6"
    "m7"
    "M7"
("addDict" variable)
----------------------------------------------------------------------------------------------------------
"slash" can get these values: ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"]
("allnotes" variable)
----------------------------------------------------------------------------------------------------------
"gripSpan" is an intiger aka biggus_handus where the user can decide the chords span according to their hand size/ability
----------------------------------------------------------------------------------------------------------
"tuning" look like this: ["E", "A", "D", "G", "B", "E"] and it is dynamic, so length is variable for eg ukulele or 7string guitar, and ofc the contents are also variable according to:
["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"]
("allnotes" variable)


so, good luck have fun nigga, ima head to sleep 2026.02.25 1:09
*/




function ChordToGrips(mainInput)
{
    possible_grips = [];
    gripnotes = [];
    fullchordgrips = [];
    fullchordnotes = [];
    console.clear();

    input(mainInput);
    ChordToNotes();
    MakeFretMatrix();
    Chordcaller();

    return JSON.stringify(newchordgrips);
    
}

function input(mainInput)
{
    //root = document.getElementById("root").value;
    //tri = document.getElementById("tri").value;
    //add = document.getElementById("add").value;
    //slash = document.getElementById("slash").value;
    //biggus_handus = 3;

    //let inputtext = '{"root":"E","tri":"maj","add":"","slash":"","gripSpan":"3"}';
    const inputjson = JSON.parse(mainInput);
    root = inputjson.root;
    tri = inputjson.tri;
    add = inputjson.add;
    slash = inputjson.slash;
    biggus_handus = inputjson.gripSpan;
    tuning = inputjson.tuning;
    

}

function ChordToNotes()
{
    noteindexes = [];
    rootindex = allnotes.indexOf(root);

    chordRelDisc = [];

    noteindexes = [...tritones[tri]];
    addDisc = "";

    if(add != "")
    {
        addDisc = add.split(", ");
        for (let k = 0; k < addDisc.length; k++) 
        {
           noteindexes.push(addDict[addDisc[k]])
        }
    }
 

    for (let i = 0; i < noteindexes.length; i++) 
    {
        temp = noteindexes[i]-1+rootindex;
        if(allnotes.length <= temp)
        {
            temp = temp-12;
        }
        chordRelDisc.push(temp);
        
    }

    lownote = "";
    if(slash != "")
    {
        lownote = slash;
    }
    else
    {
        lownote = root;
    }

    NotesInChord = [lownote];
    for (let l = 0; l < chordRelDisc.length; l++) 
    {
        if(allnotes[chordRelDisc[l]] != lownote)
        {
            NotesInChord.push(allnotes[chordRelDisc[l]]);
        }

    }


}



function Chordcaller()
{

    
    possible_grips = [];
    //console.log(NotesInChord);
    //console.log(lownote);

    minfullsize = tuning.length-(NotesInChord.length);

    //structure as should be for E maj
    //0 4 7 12 16 19

    //0 12


    if(minfullsize >= 0)
    {
      
        //for (let i = tuning.length-1; i > 0; i--) 
        {
            //console.log(i)   
            //starting_fret = fretboard[i].indexOf(lownote);
           // starting_frets = fretboard[i].filter(fret => fret.includes(lownote)); //baaaaad stuff
            let starting_frets = [];
            for(let j = 0; j < fretboard[tuning.length-1].length; j++)
            {
                if(fretboard[tuning.length-1][j] == lownote) 
                    {starting_frets.push(j);}
            
            }
            //possible_grips.push(starting_frets); //should be 0;12 for Emaj
            // console.log(possible_grips);
            Magik();

        }
    }
    else
    {
        //több hang mint húr :P
    }

}
// a chord caller meghívja a magiket- egy egy rootnotera, a magik egy- egy rootnotera chordot épít lentől felfele iteratívan, rekurzívan








function Magik()
{

    
    for (let i = tuning.length; i > 0; i--) {
        temp = []
        gripnotestemp = [];
  
        for (let j = 0; j < NotesInChord.length; j++) //whats happening rn is that its finding every good fret on ONE string, could be good for recoursion
        {
            
            fret = fretboard[i-1].indexOf(NotesInChord[j]);

            temp.push(fret);
            if(NotesInChord[j] == root || NotesInChord[j] == slash)
            {
                if(NotesInChord.includes(slash))
                {
                    if(NotesInChord[j] == slash) {gripnotestemp.push("bass")}
                    if(NotesInChord[j] == root) {gripnotestemp.push("root")}   
                }
                else
                {
                    if(NotesInChord[j] == root) {gripnotestemp.push("bass")}
                }
            }
            else
            {
                trinoteindexes = [];
                trinoteindexes = [...tritones[tri]];
                rootindex = allnotes.indexOf(root);
             
                NoteFifthRelDisc = trinoteindexes[2]-1+rootindex;
                if(allnotes.length <= NoteFifthRelDisc)
                {
                    NoteFifthRelDisc = NoteFifthRelDisc-12;
                }

                NoteThirdRelDisc = trinoteindexes[1]-1+rootindex;
                if(allnotes.length <= NoteThirdRelDisc)
                {
                    NoteThirdRelDisc = NoteThirdRelDisc-12;
                }

                if(NotesInChord[j] == allnotes[NoteFifthRelDisc] || NotesInChord[j] == allnotes[NoteThirdRelDisc])
                {
                    if(NotesInChord[j] == allnotes[NoteFifthRelDisc]) {gripnotestemp.push("fifth")}
                    if(NotesInChord[j] == allnotes[NoteThirdRelDisc]) {gripnotestemp.push("third")}
                }
                else
                {
                    gripnotestemp.push("decor");
                }

                    
                
            }


            //gripnotestemp.push(NotesInChord[j]);




        }
            
        possible_grips.push(temp);
        gripnotes.push(gripnotestemp);


    }

        

    
    //console.log(possible_grips);
    //console.log(gripnotes);

        //HERECUMSTHE NEGYDIMENZIONALISUTVONAKERESES FUCK YEAH I LOVE THAT I CHOSE THIS CAREER



    //l=possible_grips.length-1;
    for (let l = possible_grips.length-1; l > 0; l--) 
    {
        let chordgrip = [];
        let chordnotes = [];

        if(l < possible_grips.length-1)
        {
            for (let i = 0; i < possible_grips.length-1-l; i++) 
            {
                
                chordgrip.push("x");
                chordnotes.push("x");
            }
        }


    
        
        for (let i = 0; i < possible_grips[l].length; i++) 
        {
            if(gripnotes[l][i] == "bass")
            {
                chordgrip.push(possible_grips[l][i]);
                chordnotes.push(gripnotes[l][i]);
                
                // 🔥 A bass NEM állít be pozíciót
                ElMagiko(possible_grips, gripnotes, l-1, 0, chordgrip, chordnotes, null, null);
                //ElMagiko(possible_grips, gripnotes, l-1, 0, chordgrip, chordnotes, min, max);
   
            }
            
        }

    }

    //console.log(fullchordgrips);
    //console.log(fullchordnotes);

    TestChordNotes(gripnotes[0], fullchordgrips, fullchordnotes);
    


}

function TestChordNotes(chordqualities, chordgrips, chordnotes)
{
    newchordgrips = [];
    newchordnotes = [];
    for (let i = 0; i < chordgrips.length; i++)
    {
        let min = 99;
        let max = 0;
        goodQC = true;
        for (let j = 0; j < chordqualities.length; j++) 
        {
            if(!chordnotes[i].includes(chordqualities[j]) && chordnotes[i] != "x")
            {
                goodQC = false;
            }
        }
   
        for (let j = 0; j < chordgrips[i].length; j++)
        {
            if(chordgrips[i][j] < min && chordgrips[i][j] != 0 && chordgrips[i][j] != "x") {min = chordgrips[i][j]}
            if(chordgrips[i][j] > max && chordgrips[i][j] != "x") {max = chordgrips[i][j]}
        }   
        if(goodQC && max-min < biggus_handus)
        {
            newchordgrips.push(chordgrips[i]);
            newchordnotes.push(chordnotes[i]);
        } 
        
    }
    //console.log(newchordgrips);
    //console.log(newchordnotes);
}


function ElMagiko(pg, gn, stringInd, fretInd, chordgrip, chordnotes, min, max)
{
 

    if (stringInd < 0)
    {
        //maybe ide kéne tenni a gripspantestet és a notequality testet
        fullchordgrips.push([...chordgrip]);
        fullchordnotes.push([...chordnotes]);
        return;
    }

    let frets = pg[stringInd];
    let notes = gn[stringInd];

    

    for (let i = 0; i < frets.length; i++)
    {
        let fret = frets[i];
        let noteType = notes[i];

        // 🔥 fretInd használata
        if (fret != 0 && fret < fretInd)
            continue;


        

        ElMagiko(
            pg,
            gn,
            stringInd - 1,
            fretInd, // továbbadjuk!
            [...chordgrip, fret],
            [...chordnotes, noteType],
            null,
            null
        );
    }


}



/*function ElMagiko(pg, gn, stringInd, fretInd, chordgrip, chordnotes, min, max) //do this here
{
    


order = ["bass", "root", "fifth", "third", "decor"];

    necessityorder = ["bass", "root", "decor", "third", "fifth"];          //comes into play when user want more notes than strings

    tempmin = 0;
    tempmax = 0;

    j = (stringInd);

    while(j >= 0)
    {
        tempmin = min;
        tempmax = max;
        let temp = chordgrip.length;
        console.log("fretind:" + fretInd);
        for (let i = fretInd; i < (pg[stringInd].length); i++) 
        {
            console.log(temp, chordgrip.length, (temp == chordgrip.length) );
            if(chordgrip.length == 0)
            {
                alert("HUH?!?? (._.)")

            }
            else if(temp == chordgrip.length)
            {
                legacymin = tempmin;
                legacymax = tempmax;
                if(tempmax-tempmin == biggus_handus)
                {
                    console.log("358.sor: "+temp+" "+j+" "+i);
                    Pusholas(temp, j, i);
                }
                if(tempmax == 0 && gn[j][i] != 0)
                {
                    console.log("362.sor: "+temp+" "+j+" "+i);
                    tempmin = pg[j][i];
                    tempmax = pg[j][i];
                    Pusholas(temp, j, i);
                }
                
                if(pg[j][i] == 0)
                {
                    console.log("370.sor: "+temp+" "+j+" "+i);
                    Pusholas(temp, j, i);
                }
                console.log("wtf "+ tempmax, pg[j][i]);
                if(tempmax < pg[j][i] && chordgrip[chordgrip.length-1]+biggus_handus >= pg[j][i] && tempmax-tempmin != biggus_handus && pg[j][i]-biggus_handus <= tempmin)
                {
                    console.log("376.sor: "+temp+" "+j+" "+i);
                    tempmax = pg[j][i];
                    Pusholas(temp, j, i);  
                }
                if(tempmin > pg[j][i] && chordgrip[chordgrip.length-1]-biggus_handus <= pg[j][i] && tempmax-tempmin != biggus_handus && pg[j][i]+biggus_handus >= tempmax)
                {
                    console.log("382.sor: "+temp+" "+j+" "+i);
                    tempmin = pg[j][i];
                    Pusholas(temp, j, i);
                }
                console.log("cg" + chordgrip);

               
                if(1 == 1)
                {
            
                    if(temp != chordgrip.length &&  i+1 < (pg[j].length))
                    {
                     
        
                        let tempcg = JSON.parse(JSON.stringify(chordgrip)); //bitch ass javascript dont let live and wants to pop the original fucking variable too
                        let tempcn = JSON.parse(JSON.stringify(chordnotes)); // (ˇ~ˇ)
                        tempcg.pop();
                        tempcn.pop();
                      
                        
                        ElMagiko(pg, gn, j, i+1, tempcg, tempcn, legacymin, legacymax);
                    }
                }
            }
        }
        console.log("temp " + temp + "   chordgriplen " + chordgrip.length);
        if(temp == chordgrip.length)
        {
            console.log("X pusholás")
            chordgrip.push("x");
            chordnotes.push("x");
        }
        console.log("min:" + min + "   max:" + max);

        j--;
    }
    
    console.log(chordgrip);
    console.log(chordnotes);

    console.log(min, max);

    function Pusholas(temp, j, i)
    {
        if((pg[j][i] >= tempmin && pg[j][i] <= tempmax) || pg[j][i] == 0)
        {
            if(temp == chordgrip.length)
            {
                chordgrip.push(pg[j][i]);
                chordnotes.push(gn[j][i]);
                
                min = tempmin;
                max = tempmax;

                console.log("PUSH");
                //if(chordgrip[chordgrip.length] >)
    
                //if(chordgrip[i] < min && chordgrip[i] < min - biggus_handus) {min = chordgrip[i]}
                //if(chordgrip[i] > max && chordgrip[i] > max + biggus_handus) {max = chordgrip[i]}
    
            }
        }
    }
    fullchordgrips.push(chordgrip);
    fullchordnotes.push(chordnotes);
    return;
}

*/


/*function ElMagiko(pg, gn, stringInd, fretInd, chordgrip, chordnotes, min, max) //GPT
{
    let foundValidFret = false;

    if (stringInd < 0)
    {
        
        fullchordgrips.push([...chordgrip]);
        fullchordnotes.push([...chordnotes]);
        return;
    }

    let frets = pg[stringInd];
    let notes = gn[stringInd];

    

    for (let i = 0; i < frets.length; i++)
    {
        let fret = frets[i];
        let noteType = notes[i];

        // 🔥 fretInd használata
        if (fret !== 0 && fret < fretInd)
            continue;

        let newMin = min;
        let newMax = max;

        if (fret > 0)
        {
            if (min === null)
            {
                newMin = fret;
                newMax = fret;
            }
            else
            {
                newMin = Math.min(min, fret);
                newMax = Math.max(max, fret);
            }

            if (newMax - newMin > biggus_handus)
                continue;
        }

        foundValidFret = true;

        ElMagiko(
            pg,
            gn,
            stringInd - 1,
            fretInd, // továbbadjuk!
            [...chordgrip, fret],
            [...chordnotes, noteType],
            newMin,
            newMax
        );
    }

    if (!foundValidFret)
    {
        ElMagiko(
            pg,
            gn,
            stringInd - 1,
            fretInd,
            [...chordgrip, "x"],
            [...chordnotes, "x"],
            min,
            max
        );
    }
}*/

////////////////// THIS IS A FUCKING DISASTER, NOTE TO SELF: FUCK OFF!!!!

function MakeFretMatrix()
{
    fretboard = [];
    for (let k = 0; k < tuning.length; k++) 
    {
        onestring = [];
        onestring.push(tuning[k]);
        for (let j = 0; j < fretboardLength; j++)
        {
            temp = allnotes.indexOf(onestring[j]);
            if(temp >= 11)
            {
                temp= -1;
            }
            onestring.push(allnotes[temp+1]);
            
        }
        fretboard.push(onestring);
    }
    //console.log(fretboard);
    
}
