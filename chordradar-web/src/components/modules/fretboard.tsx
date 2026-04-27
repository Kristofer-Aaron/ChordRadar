import React, { useEffect, useMemo, useState } from 'react';
import NoteUtilities from '../../utils/noteUtilities';
import './fretboard.css';

const fretCount = 21;
const singleMarkerFrets = new Set([3, 5, 7, 9, 15, 17, 19]);
const doubleMarkerFrets = new Set([12]);

type Fretboard2Props = {
    onSelectedMidisChange?: (midis: number[]) => void;
    externalFrets?: Record<number, number | null> | null;
    onFretUserChange?: () => void;
};

export default function Fretboard2({ onSelectedMidisChange, externalFrets, onFretUserChange }: Fretboard2Props) {
    const [stringCount, setStringCount] = useState(6);
    const [selectedFrets, setSelectedFrets] = useState<Record<number, number | null>>({});
    const [tuning, setTuning] = useState<number[]>(() =>
        Array.from({ length: 8 }, (_, index) => {
            const fallback = NoteUtilities.tuning[index] ?? NoteUtilities.tuning[0] ?? 40;
            return Math.max(0, Math.min(127, fallback));
        }),
    );

    const stringIndexes = useMemo(
        () => Array.from({ length: stringCount }, (_, index) => stringCount - 1 - index),
        [stringCount],
    );

    function UpdateStringCount() {
        setStringCount(Number((document.getElementById('string-slider') as HTMLInputElement).value));
    }

    function updateStringTuning(stringIndex: number, delta: number) {
        setTuning((current) =>
            current.map((midiNote, index) => {
                if (index !== stringIndex) {
                    return midiNote;
                }
                return Math.max(0, Math.min(127, midiNote + delta));
            }),
        );
    }

    function onStringFretChange(stringIndex: number, fret: number | null) {
        onFretUserChange?.();
        setSelectedFrets((prev) => ({
            ...prev,
            [stringIndex]: fret,
        }));
    }

    function resetSelectedFrets() {
        onFretUserChange?.();
        setSelectedFrets({});
    }

    const activeSelectedFrets = externalFrets ?? selectedFrets;

    const selectedMidis = useMemo(
        () =>
            stringIndexes
                .map((stringIndex) => {
                    const fret = activeSelectedFrets[stringIndex];
                    if (fret === null || fret === undefined) {
                        return null;
                    }

                    const openStringMidi = tuning[stringIndex] ?? NoteUtilities.tuning[stringIndex] ?? 40;
                    return openStringMidi + fret;
                })
                .filter((midi): midi is number => midi !== null),
        [activeSelectedFrets, stringIndexes, tuning],
    );

    useEffect(() => {
        onSelectedMidisChange?.(selectedMidis);
    }, [onSelectedMidisChange, selectedMidis]);

	return (
        <div className='fretboard-horizontal-scroll'>
            <section className='module-shell'>
		        <div className='module' id='fretboard' aria-label='ChordRadar Fretboard Module'>
                    <div className='module-inner'>
                        <div className='tuning-frame'>
                            <div className='module-top'>
                                <div>
                                    <button className='button power-button'>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                            <g transform='rotate(270 12 12)'>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
                                            </g>
                                        </svg>
                                    </button>
                                    <span className='title'>CR FRETBOARD</span>
                                </div>
                                <div className='top-controls'>
                                    <button className='button reset-button' type='button' onClick={resetSelectedFrets} aria-label='Reset selected notes'>

                                            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' aria-hidden='true'>
                                                <path strokeLinecap='round' strokeLinejoin='round' d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99' />
                                            </svg>
                                        
                                    </button>
                                    {/* <div>
                                        <input className='slider' type="range" id="hand-slider" defaultValue={1} min="0" max="1"/>
                                        <span className='slider-text'>L — R</span>
                                    </div> */}
                                    <div>
                                        <input className='slider' type="range" id="string-slider" defaultValue={6} min="4" max="8" onInput={UpdateStringCount}/>
                                        <span className='slider-text'>4 — 5 — 6 — 7 — 8</span>
                                    </div>
                                </div>
                            </div>
                            <div className='display-frame'>
                                <div className='display'>
                                    {stringIndexes.map((stringIndex) => {
                                        const midiNote = tuning[stringIndex] ?? (NoteUtilities.tuning[stringIndex] ?? 40);
                                        const noteName = NoteUtilities.getNoteName(midiNote, true) ?? '--';
                                        const octave = NoteUtilities.getOctave(midiNote);

                                        return (
                                            <div className='tuning-spinner' key={stringIndex}>
                                                <button
                                                    type='button'
                                                    className='tuning-spinner-button'
                                                    onClick={() => updateStringTuning(stringIndex, -1)}
                                                    aria-label={`Tune string ${stringIndex + 1} down`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                                                    </svg>
                                                </button>
                                                <span className='note-label' aria-label={`String ${stringIndex + 1}: ${noteName}${octave !== null ? octave : ''}`}>
                                                    {noteName}
                                                    {octave !== null ? <sup>{octave}</sup> : null}
                                                </span>
                                                <button
                                                    type='button'
                                                    className='tuning-spinner-button'
                                                    onClick={() => updateStringTuning(stringIndex, 1)}
                                                    aria-label={`Tune string ${stringIndex + 1} up`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                    </svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className='neck-frame'>
                            <div className='neck'>
                                {Array.from({ length: fretCount }).map((_, fret) => (
                                    <React.Fragment key={fret}>
                                        <div className='fretboard-column' data-fret={fret}>
                                            {(singleMarkerFrets.has(fret) || doubleMarkerFrets.has(fret)) && (
                                                <div className={`fret-marker${doubleMarkerFrets.has(fret) ? ' isDouble' : ''}`} aria-hidden='true'>
                                                    <span />
                                                    {doubleMarkerFrets.has(fret) ? <span /> : null}
                                                </div>
                                            )}
                                            {stringIndexes.map((stringIndex) => {
                                                const midiNote = tuning[stringIndex] + fret;
                                                const noteName = NoteUtilities.getNoteName(midiNote, true) ?? '';
                                                const octave = NoteUtilities.getOctave(midiNote);
                                                const inputId = `s${stringIndex}f${fret}`;
                                                const isChecked = activeSelectedFrets[stringIndex] === fret;

                                                return (
                                                    <div key={inputId} className={`fretboard-cell string-${stringIndex}`}>
                                                        <input
                                                            type='radio'
                                                            name={`s${stringIndex}`}
                                                            value={fret}
                                                            id={inputId}
                                                            className='fretboard-radio'
                                                            data-midi={midiNote}
                                                            data-note={noteName}
                                                            checked={isChecked}
                                                            onChange={() => onStringFretChange(stringIndex, fret)}
                                                            onClick={() => {
                                                                if (isChecked) {
                                                                    onStringFretChange(stringIndex, null);
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor={inputId}>
                                                            <div>
                                                                {noteName}
                                                                {octave !== null ? <sup>{octave}</sup> : null}
                                                            </div>
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {fret === 0 ? (
                                            <div className='nut' />
                                        ) : (
                                            <div className='fret' />
                                        )}
                                    </React.Fragment>
                                ))}
                                <div className='strings-frame'>
                                    {Array.from({ length: stringCount }).map((_, i) => (
                                        <div className='string' key={i} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
		        </div>
            <div className='module-edge'></div>
        </section>
        </div>
	);
}

