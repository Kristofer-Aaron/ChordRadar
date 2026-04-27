import { useMemo, useState } from 'react';
import { generateChordVoicings } from '../../utils/chordExploration';
import NoteUtilities from '../../utils/noteUtilities';
import { getMasterVolume, playMidiChord, setMasterVolume } from '../../utils/soundGenerator';
import './processor.css';

const CHORD_NAME_STORAGE_KEY = 'chordradar.processor.savedChordNames';
const ROOT_OPTIONS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const CHORD_TYPES = ['maj', 'min', 'sus2', 'sus4', '5', 'dim', 'aug'] as const;
const ADD_OPTIONS = ['', 'M7', 'm7', '9'] as const;

type ProcessorTab = 'analyze' | 'explore' | 'saved';
type Voicing = Array<number | 'x'>;

type ProcessorProps = {
    mode?: 'analyze';
    foundChords?: readonly string[];
    selectedMidis?: readonly number[];
    isAuthenticated?: boolean;
    onGripSelect?: (voicing: Voicing) => void;
    onSavedChordSelect?: (chordName: string) => void;
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

function ChordSourceIcon({ isUserSaved }: { isUserSaved: boolean }) {
    return isUserSaved ? (
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.5} className='chord-source-icon isUser' aria-label='User saved chord name'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.25a8.25 8.25 0 0 1 14.998 0' />
        </svg>
    ) : (
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.5} className='chord-source-icon isDatabase' aria-label='Database chord name'>
            <ellipse cx='12' cy='5' rx='7' ry='3' />
            <path d='M5 5v10c0 1.657 3.134 3 7 3s7-1.343 7-3V5' />
        </svg>
    );
}

function getVoicingMetrics(voicing: Voicing, tuning: number[]) {
    const midis = voicing
        .map((fret, i) => (fret === 'x' || typeof tuning[i] !== 'number' ? null : (tuning[i] as number) + fret))
        .filter((m): m is number => m !== null);
    if (!midis.length) return { min: Infinity, avg: Infinity, max: Infinity };
    const min = Math.min(...midis);
    const max = Math.max(...midis);
    const avg = midis.reduce((s, m) => s + m, 0) / midis.length;
    return { min, avg, max };
}

export default function Processor({ mode = 'analyze', foundChords = [], selectedMidis = [], isAuthenticated = false, onGripSelect, onSavedChordSelect }: ProcessorProps) {
    const [activeTab, setActiveTab] = useState<ProcessorTab>(mode);
    const [volume, setVolume] = useState(() => Math.round(getMasterVolume() * 100));
    const [selectedAnalyzeChord, setSelectedAnalyzeChord] = useState('');
    const [selectedSavedChord, setSelectedSavedChord] = useState('');
    const [savedChordNames, setSavedChordNames] = useState<Record<string, string>>(() => {
        try {
            const stored = typeof window !== 'undefined' && window.localStorage.getItem(CHORD_NAME_STORAGE_KEY);
            return stored ? JSON.parse(stored) as Record<string, string> : {};
        } catch {
            return {};
        }
    });
    const [draftChordNames, setDraftChordNames] = useState<Record<string, string>>({});
    const [rootNote, setRootNote] = useState<(typeof ROOT_OPTIONS)[number]>('C');
    const [chordType, setChordType] = useState<(typeof CHORD_TYPES)[number]>('maj');
    const [add, setAdd] = useState<(typeof ADD_OPTIONS)[number]>('');
    const [slashNote, setSlashNote] = useState<'' | (typeof ROOT_OPTIONS)[number]>('');
    const [gripSpan, setGripSpan] = useState(3);
    const [selectedGrip, setSelectedGrip] = useState('');

    const currentTab: ProcessorTab = activeTab === 'saved' && !isAuthenticated ? 'analyze' : activeTab;
    const isAnalyzeTab = currentTab === 'analyze';
    const isSavedTab = currentTab === 'saved';
    const isExploreTab = currentTab === 'explore';

    const savedChordEntries = useMemo(
        () =>
            Object.entries(savedChordNames)
                .filter(([, v]) => v.trim().length > 0)
                .sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0])),
        [savedChordNames],
    );
    const savedChords = useMemo(() => savedChordEntries.map(([chord]) => chord), [savedChordEntries]);

    const activeAnalyzeChord = foundChords.includes(selectedAnalyzeChord) ? selectedAnalyzeChord : (foundChords[0] ?? '');
    const activeSavedChord = savedChordEntries.some(([chord]) => chord === selectedSavedChord)
        ? selectedSavedChord
        : (savedChordEntries[0]?.[0] ?? '');
    const editableChord = isSavedTab ? activeSavedChord : activeAnalyzeChord;
    const customChordName = editableChord ? (draftChordNames[editableChord] ?? savedChordNames[editableChord] ?? '') : '';

    const exploreVoicings = useMemo(() => {
        const tuning = [...NoteUtilities.tuning];
        const tuningNames = tuning.map((midi) => NoteUtilities.getNoteName(midi, true) ?? 'C');
        return generateChordVoicings({ root: rootNote, triad: chordType, add, slash: slashNote, gripSpan, tuning: tuningNames })
            .slice()
            .sort((a, b) => {
                const ma = getVoicingMetrics(a, tuning);
                const mb = getVoicingMetrics(b, tuning);
                return ma.min - mb.min || ma.avg - mb.avg || ma.max - mb.max || a.join('-').localeCompare(b.join('-'));
            });
    }, [add, chordType, gripSpan, rootNote, slashNote]);

    function updateDraftChordName(value: string) {
        if (editableChord) setDraftChordNames((prev) => ({ ...prev, [editableChord]: value }));
    }

    function persistChordNames(next: Record<string, string>) {
        window.localStorage.setItem(CHORD_NAME_STORAGE_KEY, JSON.stringify(next));
    }

    function saveChordName() {
        if (!isAuthenticated || !editableChord) return;
        setSavedChordNames((prev) => {
            const next = { ...prev };
            const name = customChordName.trim();
            if (name) next[editableChord] = name;
            else delete next[editableChord];
            persistChordNames(next);
            return next;
        });
    }

    function resetChordName() {
        if (!isAuthenticated || !editableChord) return;
        setDraftChordNames((prev) => {
            if (!(editableChord in prev)) return prev;
            const next = { ...prev };
            delete next[editableChord];
            return next;
        });
        setSavedChordNames((prev) => {
            if (!(editableChord in prev)) return prev;
            const next = { ...prev };
            delete next[editableChord];
            persistChordNames(next);
            return next;
        });
    }

    async function playSelectedNotes() {
        if (selectedMidis.length === 0) {
            return;
        }

        await playMidiChord(selectedMidis);
    }

    const resetIcon = (
        <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' aria-hidden='true'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99' />
        </svg>
    );

    return (
        <section className='module-shell'>
            <div className='module' id='processor' aria-label='ChordRadar Processor Module'>
                <div className='module-inner'>
                    <div className='module-top'>
                        <span className='title'>CR PROCESSOR</span>
                        <button className='button power-button'>
                            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor'>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9' />
                            </svg>
                        </button>
                    </div>

                    <div className='module-center'>
                        <div className='display-frame'>
                            <div className='display'>
                                <div className='power-on-off-screen' style={{ display: 'none' }}>W</div>

                                <div className='display-header'>
                                    <button type='button' className={cx('menu-button', isAnalyzeTab && 'selected')} onClick={() => setActiveTab('analyze')}>Analyze</button>
                                    <button type='button' className={cx('menu-button', isExploreTab && 'selected')} onClick={() => setActiveTab('explore')}>Explore</button>
                                    {isAuthenticated && (
                                        <button type='button' className={cx('menu-button', isSavedTab && 'selected')} onClick={() => setActiveTab('saved')}>Saved</button>
                                    )}
                                </div>

                                {/* ── Analyze ── */}
                                <div id='analyze-body' hidden={!isAnalyzeTab}>
                                    <div className='badge-list' id='analyze-list'>
                                        {foundChords.length > 0 ? foundChords.map((chord) => (
                                            <button
                                                key={chord}
                                                type='button'
                                                className={cx('badge', activeAnalyzeChord === chord && 'isSelected')}
                                                onClick={() => setSelectedAnalyzeChord(chord)}
                                                aria-pressed={activeAnalyzeChord === chord}
                                            >
                                                <span className='chord-badge-content'>
                                                    <span className='chord-badge-name'>{savedChordNames[chord]?.trim() || chord}</span>
                                                    <ChordSourceIcon isUserSaved={Boolean(savedChordNames[chord]?.trim())} />
                                                </span>
                                            </button>
                                        )) : (
                                            <span className='empty-copy'>Select notes on fretboard</span>
                                        )}
                                    </div>

                                    <div className='vertical-line' />

                                    <div id='analyze-chords-menu'>
                                        {!isAuthenticated ? (
                                            <div className='auth-required'>
                                                <span className='auth-required-label'>SIGN IN REQUIRED</span>
                                                <span className='auth-required-copy'>You need to sign in to use the chord naming menu.</span>
                                            </div>
                                        ) : (
                                            <>
                                                <label className='menu-label' htmlFor='processor-chord-name'>CHORD NAME</label>
                                                <input
                                                    id='processor-chord-name'
                                                    className='name-input'
                                                    type='text'
                                                    value={customChordName}
                                                    onChange={(e) => updateDraftChordName(e.target.value)}
                                                    placeholder={editableChord || 'Name chord'}
                                                    disabled={!editableChord}
                                                />
                                                <div className='menu-preview'>
                                                    <span className='menu-preview-label'>VALUE</span>
                                                    <span className='menu-preview-value'>{editableChord || '--'}</span>
                                                </div>
                                                <div className='menu-actions'>
                                                    <button type='button' className='save-button' onClick={saveChordName} disabled={!editableChord}>SAVE</button>
                                                    <button type='button' className='reset-button' onClick={resetChordName} disabled={!editableChord || !customChordName} aria-label='Reset custom chord name' title='Reset custom chord name'>
                                                        {resetIcon}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* ── Explore ── */}
                                <div id='explore-chords-body' hidden={!isExploreTab}>
                                    <div id='explore-chords-menu'>
                                        <div className='explore-controls'>
                                            <label className='explore-field'>
                                                <span className='explore-label'>ROOT</span>
                                                <select value={rootNote} onChange={(e) => setRootNote(e.target.value as (typeof ROOT_OPTIONS)[number])}>
                                                    {ROOT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            </label>
                                            <label className='explore-field'>
                                                <span className='explore-label'>TYPE</span>
                                                <select value={chordType} onChange={(e) => setChordType(e.target.value as (typeof CHORD_TYPES)[number])}>
                                                    {CHORD_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            </label>
                                            <label className='explore-field'>
                                                <span className='explore-label'>ADD</span>
                                                <select value={add} onChange={(e) => setAdd(e.target.value as (typeof ADD_OPTIONS)[number])}>
                                                    {ADD_OPTIONS.map((o) => <option key={o || 'none'} value={o}>{o || 'None'}</option>)}
                                                </select>
                                            </label>
                                            <label className='explore-field'>
                                                <span className='explore-label'>SLASH</span>
                                                <select value={slashNote} onChange={(e) => setSlashNote(e.target.value as '' | (typeof ROOT_OPTIONS)[number])}>
                                                    <option value=''>None</option>
                                                    {ROOT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            </label>
                                            <label className='explore-field'>
                                                <span className='explore-label'>SPAN</span>
                                                <select value={gripSpan} onChange={(e) => setGripSpan(Number(e.target.value))}>
                                                    {[1, 2, 3, 4, 5].map((o) => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            </label>
                                        </div>
                                    </div>
                                    <div className='vertical-line' />
                                    <div className='badge-list' id='explore-chords-list'>
                                        {exploreVoicings.length > 0 ? (
                                            <>
                                                {exploreVoicings.map((voicing) => {
                                                    const label = voicing.join('-');
                                                    return (
                                                        <button
                                                            key={label}
                                                            type='button'
                                                            className={cx('grip-badge', selectedGrip === label && 'isSelected')}
                                                            onClick={() => { setSelectedGrip(label); onGripSelect?.(voicing); }}
                                                        >
                                                            {label}
                                                        </button>
                                                    );
                                                })}
                                            </>
                                        ) : (
                                            <span className='empty-copy'>No grips found.</span>
                                        )}
                                    </div>
                                </div>

                                {/* ── Saved ── */}
                                <div id='saved-chords-body' hidden={!isSavedTab}>
                                    <div className='badge-list' id='saved-chords-list'>
                                        {savedChords.length > 0 ? savedChords.map((chord) => (
                                            <button
                                                key={chord}
                                                type='button'
                                                className={cx('badge', activeSavedChord === chord && 'isSelected')}
                                                onClick={() => { setSelectedSavedChord(chord); onSavedChordSelect?.(chord); }}
                                                aria-pressed={activeSavedChord === chord}
                                            >
                                                <span className='chord-badge-content'>
                                                    <span className='chord-badge-name'>{savedChordNames[chord]?.trim() || chord}</span>
                                                    <ChordSourceIcon isUserSaved={Boolean(savedChordNames[chord]?.trim())} />
                                                </span>
                                            </button>
                                        )) : (
                                            <span className='empty-copy'>No saved chords yet.</span>
                                        )}
                                    </div>

                                    <div className='vertical-line' />

                                    <div id='saved-chords-menu'>
                                        <label className='menu-label' htmlFor='saved-chord-name'>CHORD NAME</label>
                                        <input
                                            id='saved-chord-name'
                                            className='name-input'
                                            type='text'
                                            value={customChordName}
                                            onChange={(e) => updateDraftChordName(e.target.value)}
                                            placeholder={editableChord || 'Name chord'}
                                            disabled={!editableChord}
                                        />
                                        <div className='menu-preview'>
                                            <span className='menu-preview-label'>VALUE</span>
                                            <span className='menu-preview-value'>{editableChord || '--'}</span>
                                        </div>
                                        <div className='menu-actions'>
                                            <button type='button' className='save-button' onClick={saveChordName} disabled={!editableChord}>SAVE</button>
                                            <button type='button' className='reset-button' onClick={resetChordName} disabled={!editableChord || !customChordName} aria-label='Reset custom chord name' title='Reset custom chord name'>
                                                {resetIcon}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='module-bottom'>
                        <span className='slider-text'>VOLUME</span>

                        <input
                            className='slider'
                            id='volume-slider'
                            type='range'
                            min={0}
                            max={100}
                            value={volume}
                            onChange={(e) => {
                                const nextVolume = Number(e.target.value);
                                setVolume(nextVolume);
                                setMasterVolume(nextVolume / 100);
                            }}
                            aria-label='Volume'
                        />

                        <span className='play-sound-text'>PLAY SOUND</span>
                        <button className='button' type='button' aria-label='Play selected notes' onClick={() => { void playSelectedNotes(); }}>
                            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='size-6'>
                                <path strokeLinecap='round' strokeLinejoin='round' d='M21 7.5V18M15 7.5V18M3 16.811V8.69c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811Z' />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div className='module-edge'>
                <div className='speaker' />
                <div className='speaker' />
            </div>
        </section>
    );
}

