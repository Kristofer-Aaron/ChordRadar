import { useMemo, useState } from 'react';
import { generateChordVoicings } from '../../utils/chordExploration';
import NoteUtilities from '../../utils/noteUtilities';
import './processor.css';

const CHORD_NAME_STORAGE_KEY = 'chordradar.processor.savedChordNames';
const ROOT_OPTIONS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const CHORD_TYPES = ['maj', 'min', 'sus2', 'sus4', '5', 'dim', 'aug'] as const;
const ADD_OPTIONS = ['', 'M7', 'm7', '9'] as const;

type ProcessorTab = 'analyze' | 'explore' | 'saved';

type ProcessorProps = {
    mode?: 'analyze';
    foundChords?: readonly string[];
    isAuthenticated?: boolean;
    onGripSelect?: (voicing: Array<number | 'x'>) => void;
    onSavedChordSelect?: (chordName: string) => void;
};

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
    return classNames.filter(Boolean).join(' ');
}

type ChordSourceIconProps = {
    isUserSaved: boolean;
};

function ChordSourceIcon({ isUserSaved }: ChordSourceIconProps) {
    if (isUserSaved) {
        return (
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.5} className='processor-chord-source-icon isUser' aria-label='User saved chord name'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.25a8.25 8.25 0 0 1 14.998 0' />
            </svg>
        );
    }

    return (
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.5} className='processor-chord-source-icon isDatabase' aria-label='Database chord name'>
            <ellipse cx='12' cy='5' rx='7' ry='3' />
            <path d='M5 5v10c0 1.657 3.134 3 7 3s7-1.343 7-3V5' />
        </svg>
    );
}

export default function Processor({ mode = 'analyze', foundChords = [], isAuthenticated = false, onGripSelect, onSavedChordSelect }: ProcessorProps) {
    const [activeTab, setActiveTab] = useState<ProcessorTab>(mode);
    const [selectedAnalyzeChord, setSelectedAnalyzeChord] = useState('');
    const [selectedSavedChord, setSelectedSavedChord] = useState('');
    const [savedChordNames, setSavedChordNames] = useState<Record<string, string>>(() => {
        if (typeof window === 'undefined') {
            return {};
        }

        try {
            const stored = window.localStorage.getItem(CHORD_NAME_STORAGE_KEY);
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

    const tabs = useMemo(
        () => [
            { id: 'analyze' as const, label: 'Analyze' },
            { id: 'explore' as const, label: 'Explore' },
            ...(isAuthenticated ? [{ id: 'saved' as const, label: 'Saved Chords' }] : []),
        ],
        [isAuthenticated],
    );

    const currentTab: ProcessorTab = activeTab === 'saved' && !isAuthenticated ? 'analyze' : activeTab;

    const savedChordEntries = useMemo(
        () =>
            Object.entries(savedChordNames)
                .filter(([, value]) => value.trim().length > 0)
                .sort((left, right) => left[1].localeCompare(right[1]) || left[0].localeCompare(right[0])),
        [savedChordNames],
    );

    const activeAnalyzeChord = foundChords.includes(selectedAnalyzeChord) ? selectedAnalyzeChord : (foundChords[0] ?? '');
    const activeSavedChord = savedChordEntries.some(([chord]) => chord === selectedSavedChord)
        ? selectedSavedChord
        : (savedChordEntries[0]?.[0] ?? '');
    const editableChord = currentTab === 'saved' ? activeSavedChord : activeAnalyzeChord;
    const customChordName = editableChord ? (draftChordNames[editableChord] ?? savedChordNames[editableChord] ?? '') : '';
    const savedChords = useMemo(() => savedChordEntries.map(([chord]) => chord), [savedChordEntries]);

    const exploreVoicings = useMemo(() => {
        const tuning = [...NoteUtilities.tuning];
        const tuningNames = tuning.map((midiNote) => NoteUtilities.getNoteName(midiNote, true) ?? 'C');

        const rawVoicings = generateChordVoicings({
            root: rootNote,
            triad: chordType,
            add,
            slash: slashNote,
            gripSpan,
            tuning: tuningNames,
        });

        const getVoicingMetrics = (voicing: Array<number | 'x'>) => {
            const soundingMidis = voicing
                .map((fret, index) => {
                    if (fret === 'x') {
                        return null;
                    }

                    const openString = tuning[index];
                    return typeof openString === 'number' ? openString + fret : null;
                })
                .filter((midi): midi is number => midi !== null);

            if (!soundingMidis.length) {
                return { min: Number.POSITIVE_INFINITY, avg: Number.POSITIVE_INFINITY, max: Number.POSITIVE_INFINITY };
            }

            const min = Math.min(...soundingMidis);
            const max = Math.max(...soundingMidis);
            const avg = soundingMidis.reduce((sum, midi) => sum + midi, 0) / soundingMidis.length;
            return { min, avg, max };
        };

        return rawVoicings.slice().sort((left, right) => {
            const leftMetrics = getVoicingMetrics(left);
            const rightMetrics = getVoicingMetrics(right);

            if (leftMetrics.min !== rightMetrics.min) {
                return leftMetrics.min - rightMetrics.min;
            }
            if (leftMetrics.avg !== rightMetrics.avg) {
                return leftMetrics.avg - rightMetrics.avg;
            }
            if (leftMetrics.max !== rightMetrics.max) {
                return leftMetrics.max - rightMetrics.max;
            }
            return left.join('-').localeCompare(right.join('-'));
        });
    }, [add, chordType, gripSpan, rootNote, slashNote]);

    function getDisplayChordName(chord: string) {
        const savedName = savedChordNames[chord]?.trim();
        return savedName || chord;
    }

    function isUserSavedChord(chord: string) {
        return Boolean(savedChordNames[chord]?.trim());
    }

    function updateDraftChordName(nextValue: string) {
        if (!editableChord) {
            return;
        }

        setDraftChordNames((current) => ({
            ...current,
            [editableChord]: nextValue,
        }));
    }

    function persistSavedChordNames(next: Record<string, string>) {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(CHORD_NAME_STORAGE_KEY, JSON.stringify(next));
        }
    }

    function saveChordName() {
        if (!isAuthenticated || !editableChord || typeof window === 'undefined') {
            return;
        }

        const nextName = customChordName.trim();

        setSavedChordNames((current) => {
            const next = { ...current };

            if (nextName) {
                next[editableChord] = nextName;
            } else {
                delete next[editableChord];
            }

            persistSavedChordNames(next);
            return next;
        });
    }

    function resetChordName() {
        if (!isAuthenticated || !editableChord || typeof window === 'undefined') {
            return;
        }

        setDraftChordNames((current) => {
            if (!(editableChord in current)) {
                return current;
            }

            const next = { ...current };
            delete next[editableChord];
            return next;
        });

        setSavedChordNames((current) => {
            if (!(editableChord in current)) {
                return current;
            }

            const next = { ...current };
            delete next[editableChord];
            persistSavedChordNames(next);
            return next;
        });
    }

    function renderChordList(chords: readonly string[], activeChord: string, onSelect: (chord: string) => void) {
        if (chords.length === 0) {
            return <span className='processor-empty-copy'>Select notes on fretboard</span>;
        }

        return (
            <div className='processor-chord-list'>
                {chords.map((chord) => (
                    <button
                        key={chord}
                        type='button'
                        className={joinClassNames(
                            'processor-chord-badge',
                            activeChord === chord ? 'isSelected' : '',
                        )}
                        onClick={() => onSelect(chord)}
                        aria-pressed={activeChord === chord}
                    >
                        <span className='processor-chord-badge-content'>
                            <span className='processor-chord-badge-name'>{getDisplayChordName(chord)}</span>
                            <ChordSourceIcon isUserSaved={isUserSavedChord(chord)} />
                        </span>
                    </button>
                ))}
            </div>
        );
    }

    function renderAnalyzeLikePane({
        chords,
        activeChord,
        onSelect,
        emptyMessage,
    }: {
        chords: readonly string[];
        activeChord: string;
        onSelect: (chord: string) => void;
        emptyMessage?: string;
    }) {
        return (
            <div className='processor-analyze-body'>
                <div className='processor-analyze-results'>
                    {chords.length > 0 ? renderChordList(chords, activeChord, onSelect) : <span className='processor-empty-copy'>{emptyMessage ?? 'Select notes on fretboard'}</span>}
                </div>
                {renderMenuPane()}
            </div>
        );
    }

    function renderMenuPane() {
        if (!isAuthenticated && currentTab === 'analyze') {
            return (
                <div className='processor-analyze-menu'>
                    <div className='processor-auth-required'>
                        <span className='processor-auth-required-label'>SIGN IN REQUIRED</span>
                        <span className='processor-auth-required-copy'>You need to sign in to use the chord naming menu.</span>
                    </div>
                </div>
            );
        }

        return (
            <div className='processor-analyze-menu'>
                <label className='processor-menu-label' htmlFor='processor-chord-name'>
                    CHORD NAME
                </label>
                <input
                    id='processor-chord-name'
                    className='processor-name-input'
                    type='text'
                    value={customChordName}
                    onChange={(event) => updateDraftChordName(event.target.value)}
                    placeholder={editableChord || 'Name chord'}
                    disabled={!isAuthenticated || !editableChord}
                />
                <div className='processor-menu-preview'>
                    <span className='processor-menu-preview-label'>VALUE</span>
                    <span className='processor-menu-preview-value'>
                        {editableChord || '--'}
                    </span>
                </div>
                <div className='processor-menu-actions'>
                    <button
                        type='button'
                        className='processor-save-button'
                        onClick={saveChordName}
                        disabled={!isAuthenticated || !editableChord}
                    >
                        SAVE
                    </button>
                    <button
                        type='button'
                        className='processor-reset-button'
                        onClick={resetChordName}
                        disabled={!isAuthenticated || !editableChord || !customChordName}
                        aria-label='Reset custom chord name'
                        title='Reset custom chord name'
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6" aria-hidden='true'>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

	return (
        <section className="module-shell">
		    <div className="module" id='processor' aria-label="ChordRadar Processor Module">
                <div className='module-inner'>
                    <div className='module-top'>
                        <span className='title'>
                            CR PROCESSOR
                        </span>
                        <button className='button power-button'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
                            </svg>
                        </button>
                    </div>
                    <div className='module-center'>

                        <div className='display-frame'>
                            <div className='display'>
                                {/* <div className='display-header'>
                                    <button>Analyze</button>
                                    <button>Explore</button>
                                    <button>Saved</button>
                                </div> */}
                                <div className='processor-display-shell'>
                                    <div className='processor-display-header'>
                                        <div className='processor-tab-points' role='tablist' aria-label='Processor mode tabs'>
                                            {tabs.map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    type='button'
                                                    role='tab'
                                                    className={joinClassNames('processor-tab-point', currentTab === tab.id ? 'isActive' : '')}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    aria-selected={currentTab === tab.id}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {currentTab === 'analyze' ? (
                                        renderAnalyzeLikePane({
                                            chords: foundChords,
                                            activeChord: activeAnalyzeChord,
                                            onSelect: setSelectedAnalyzeChord,
                                        })
                                    ) : null}

                                    {currentTab === 'saved' ? (
                                        renderAnalyzeLikePane({
                                            chords: savedChords,
                                            activeChord: activeSavedChord,
                                            onSelect: (chord) => {
                                                setSelectedSavedChord(chord);
                                                onSavedChordSelect?.(chord);
                                            },
                                            emptyMessage: 'No saved chords yet.',
                                        })
                                    ) : null}

                                    {currentTab === 'explore' ? (
                                        <div className='processor-explore-body'>
                                            <div className='processor-explore-controls'>
                                                <label className='processor-explore-field'>
                                                    <span className='processor-explore-label'>ROOT</span>
                                                    <select value={rootNote} onChange={(event) => setRootNote(event.target.value as (typeof ROOT_OPTIONS)[number])}>
                                                        {ROOT_OPTIONS.map((option) => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className='processor-explore-field'>
                                                    <span className='processor-explore-label'>TYPE</span>
                                                    <select value={chordType} onChange={(event) => setChordType(event.target.value as (typeof CHORD_TYPES)[number])}>
                                                        {CHORD_TYPES.map((option) => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className='processor-explore-field'>
                                                    <span className='processor-explore-label'>ADD</span>
                                                    <select value={add} onChange={(event) => setAdd(event.target.value as (typeof ADD_OPTIONS)[number])}>
                                                        {ADD_OPTIONS.map((option) => (
                                                            <option key={option || 'none'} value={option}>{option || 'None'}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className='processor-explore-field'>
                                                    <span className='processor-explore-label'>SLASH</span>
                                                    <select value={slashNote} onChange={(event) => setSlashNote(event.target.value as '' | (typeof ROOT_OPTIONS)[number])}>
                                                        <option value=''>None</option>
                                                        {ROOT_OPTIONS.map((option) => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className='processor-explore-field'>
                                                    <span className='processor-explore-label'>SPAN</span>
                                                    <select value={gripSpan} onChange={(event) => setGripSpan(Number(event.target.value))}>
                                                        {[1, 2, 3, 4, 5].map((option) => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                            </div>
                                            <div className='processor-explore-grips'>
                                                {exploreVoicings.length > 0 ? (
                                                    <div className='processor-grip-list'>
                                                        {exploreVoicings.map((voicing) => {
                                                            const label = voicing.join('-');
                                                            return (
                                                                <button
                                                                    key={label}
                                                                    type='button'
                                                                    className={joinClassNames('processor-grip-badge', selectedGrip === label ? 'isSelected' : '')}
                                                                    onClick={() => {
                                                                        setSelectedGrip(label);
                                                                        onGripSelect?.(voicing);
                                                                    }}
                                                                >
                                                                    {label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className='processor-empty-copy'>No grips found.</span>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='module-bottom'>

                    </div>
                </div>
		    </div>
            <div className="module-edge">
                <div className="speaker" />
                <div className="speaker" />
            </div>
        </section>
	);
}

