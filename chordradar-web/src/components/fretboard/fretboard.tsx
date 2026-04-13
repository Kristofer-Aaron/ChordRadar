/**
 * Fretboard - Interactive 6-string guitar fretboard UI
 *
 * Renders fully interactive fretboard with optional tuning panel and string count
 * customization. Click fret to select (null to deselect). Supports left/right-handed
 * display, custom tuning per string, and variable string counts (4-6).
 *
 * Features: 
 *  - Controlled component pattern (selectedFrets prop + onStringFretChange callback)
 *  - Inlay markers (dots at frets 3,5,7,9,15,17,19,21 / double at 12,24)
 *  - Tuning panel with collapsible UI (scroll into view on expand)
 *  - Reversed layout for left-handed display (flex-direction: row-reverse)
 *  - Fretboard lines and note rendering
 *
 * Props: stringCount, fretCount, selectedFrets, onStringFretChange, tuning,
 *        onTuningChange, isReversed, isTuningCollapsed, onToggleTuningCollapse.
 */

import { useEffect, useMemo, useRef } from 'react';
import { NoteUtilities } from '../../utils';
import './fretboard.css';

type FretboardProps = {
    stringCount?: number;
    fretCount?: number;
    useSharps?: boolean;
    isReversed?: boolean;
    isTuningCollapsed?: boolean;
    onToggleTuningCollapse?: () => void;
    selectedFrets?: readonly (number | null)[];
    onStringFretChange?: (stringIndex: number, fret: number | null) => void;
    tuning?: readonly number[];
    onTuningChange?: (nextTuning: number[]) => void;
    className?: string;
};

const SINGLE_MARKER_FRETS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const DOUBLE_MARKER_FRETS = new Set([12, 24]);

function getMarkerType(fret: number): 'none' | 'single' | 'double' {
    if (DOUBLE_MARKER_FRETS.has(fret)) {
        return 'double';
    }

    if (SINGLE_MARKER_FRETS.has(fret)) {
        return 'single';
    }

    return 'none';
}

function getFretWidth(fret: number): number {
    if (fret === 0) {
        return 40;
    }

    const semitoneRatio = Math.pow(2, 1 / 12);
    const k = semitoneRatio - 1;
    return 2000 * (1 / Math.pow(2, fret / 24)) * k;
}

function Fretboard({
    stringCount = 6,
    fretCount = 24,
    useSharps = true,
    isReversed = false,
    isTuningCollapsed = false,
    onToggleTuningCollapse,
    selectedFrets,
    onStringFretChange,
    tuning,
    onTuningChange,
    className,
}: FretboardProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const scrollbarInnerRef = useRef<HTMLDivElement>(null);
    const isSyncingScrollRef = useRef(false);
    const previousCollapsedRef = useRef(isTuningCollapsed);
    const tuningSectionRef = useRef<HTMLDivElement>(null);
    const clampedStringCount = Math.max(1, Math.min(stringCount, NoteUtilities.tuning.length));

    const frets = useMemo(
        () => Array.from({ length: Math.max(0, fretCount) + 1 }, (_, fret) => fret),
        [fretCount],
    );

    const stringIndexes = useMemo(
        () => Array.from({ length: clampedStringCount }, (_, idx) => clampedStringCount - 1 - idx),
        [clampedStringCount],
    );

    const activeTuning = useMemo(
        () =>
            Array.from({ length: clampedStringCount }, (_, stringIndex) => {
                const fallback = NoteUtilities.tuning[stringIndex] ?? NoteUtilities.tuning[0] ?? 40;
                const fromProp = tuning?.[stringIndex];
                const rawValue = Number.isFinite(fromProp) ? Number(fromProp) : fallback;
                return Math.max(0, Math.min(127, Math.trunc(rawValue)));
            }),
        [clampedStringCount, tuning],
    );

    function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
        if (event.deltaY !== 0) {
            event.preventDefault();
            event.currentTarget.scrollLeft += event.deltaY + event.deltaX;
        }
    }

    function updateStringTuning(stringIndex: number, delta: number) {
        if (!onTuningChange) {
            return;
        }

        const next = activeTuning.map((midiNote, index) => {
            if (index !== stringIndex) {
                return midiNote;
            }

            return Math.max(0, Math.min(127, midiNote + delta));
        });

        onTuningChange(next);
    }

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) {
            return;
        }

        const scrollToTuningEdge = () => {
            const tuningSection = tuningSectionRef.current;
            if (!tuningSection) {
                const fallbackLeft = isReversed
                    ? Math.max(0, wrapper.scrollWidth - wrapper.clientWidth)
                    : 0;
                wrapper.scrollTo({ left: fallbackLeft, behavior: 'instant' });
                return;
            }

            const targetLeft = isReversed
                ? Math.max(0, tuningSection.offsetLeft + tuningSection.offsetWidth - wrapper.clientWidth)
                : Math.max(0, tuningSection.offsetLeft);
            wrapper.scrollTo({ left: targetLeft, behavior: 'instant' });
        };

        const wasCollapsed = previousCollapsedRef.current;
        previousCollapsedRef.current = isTuningCollapsed;
        const isOpening = wasCollapsed && !isTuningCollapsed;

        // While opening, pin scroll to tuning edge so the panel animates in-place.
        if (isOpening) {
            const tuningPanel = tuningSectionRef.current?.querySelector('.fretboardTuningPanel') as HTMLElement | null;
            if (!tuningPanel) {
                scrollToTuningEdge();
                return;
            }

            let finished = false;
            let animationFrameId = 0;

            const lockScrollToTuningEdge = () => {
                if (finished) {
                    return;
                }

                // Keep the viewport pinned to the tuning-edge while panel width animates.
                scrollToTuningEdge();
                animationFrameId = window.requestAnimationFrame(lockScrollToTuningEdge);
            };

            const finish = () => {
                if (finished) {
                    return;
                }
                finished = true;
                if (animationFrameId) {
                    window.cancelAnimationFrame(animationFrameId);
                }
                scrollToTuningEdge();
                tuningPanel.removeEventListener('transitionend', onTransitionEnd);
            };

            const onTransitionEnd = (event: TransitionEvent) => {
                if (event.propertyName === 'max-width' || event.propertyName === 'min-width') {
                    finish();
                }
            };

            tuningPanel.addEventListener('transitionend', onTransitionEnd);
            lockScrollToTuningEdge();
            const fallbackTimeout = window.setTimeout(finish, 320);

            return () => {
                window.clearTimeout(fallbackTimeout);
                if (animationFrameId) {
                    window.cancelAnimationFrame(animationFrameId);
                }
                tuningPanel.removeEventListener('transitionend', onTransitionEnd);
            };
        }

        scrollToTuningEdge();
    }, [isReversed, isTuningCollapsed]);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        const container = containerRef.current;
        const scrollbar = scrollbarRef.current;
        const scrollbarInner = scrollbarInnerRef.current;

        if (!wrapper || !container || !scrollbar || !scrollbarInner) {
            return;
        }

        const updateScrollbarMetrics = () => {
            scrollbarInner.style.width = `${container.scrollWidth}px`;
            scrollbar.scrollLeft = wrapper.scrollLeft;
        };

        const syncFromWrapper = () => {
            if (isSyncingScrollRef.current) {
                return;
            }
            isSyncingScrollRef.current = true;
            scrollbar.scrollLeft = wrapper.scrollLeft;
            isSyncingScrollRef.current = false;
        };

        const syncFromScrollbar = () => {
            if (isSyncingScrollRef.current) {
                return;
            }
            isSyncingScrollRef.current = true;
            wrapper.scrollLeft = scrollbar.scrollLeft;
            isSyncingScrollRef.current = false;
        };

        updateScrollbarMetrics();

        wrapper.addEventListener('scroll', syncFromWrapper, { passive: true });
        scrollbar.addEventListener('scroll', syncFromScrollbar, { passive: true });
        window.addEventListener('resize', updateScrollbarMetrics);

        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => {
                updateScrollbarMetrics();
            });
            resizeObserver.observe(wrapper);
            resizeObserver.observe(container);
        }

        return () => {
            wrapper.removeEventListener('scroll', syncFromWrapper);
            scrollbar.removeEventListener('scroll', syncFromScrollbar);
            window.removeEventListener('resize', updateScrollbarMetrics);
            resizeObserver?.disconnect();
        };
    }, [fretCount, clampedStringCount, isTuningCollapsed, isReversed]);

    const tuningControls = (
        <div
            ref={tuningSectionRef}
            className={[
                'fretboardSection',
                'fretboardTuningSection',
                isReversed ? 'isReversed' : '',
                isTuningCollapsed ? 'isCollapsed' : '',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <aside
                className={[
                    'fretboardTuningPanel',
                    isTuningCollapsed ? 'isCollapsed' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
                aria-label="Tuning settings"
                aria-hidden={isTuningCollapsed}
            >
                {stringIndexes.map((stringIndex) => {
                    const midiNote = activeTuning[stringIndex];
                    const noteName = NoteUtilities.getNoteName(midiNote, useSharps) ?? '--';
                    const octave = NoteUtilities.getOctave(midiNote);

                    return (
                        <div key={`tuning-row-${stringIndex}`} className="fretboardTuningRow">
                            <div className="fretboardTuningNote" aria-label={`String ${stringIndex + 1}: ${noteName}${octave !== null ? octave : ''}`}>
                                {noteName}{octave !== null ? <sup>{octave}</sup> : null}
                            </div>
                            {/* Stacked up/down spinner buttons, like a NumericUpDown control. */}
                            <div className="fretboardTuningSpinner">
                                <button
                                    type="button"
                                    className="fretboardTuningButton fretboardTuningButtonUp"
                                    onClick={() => updateStringTuning(stringIndex, 1)}
                                    aria-label={`Tune string ${stringIndex + 1} up`}
                                    tabIndex={isTuningCollapsed ? -1 : 0}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="fretboardTuningIcon">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    className="fretboardTuningButton fretboardTuningButtonDown"
                                    onClick={() => updateStringTuning(stringIndex, -1)}
                                    aria-label={`Tune string ${stringIndex + 1} down`}
                                    tabIndex={isTuningCollapsed ? -1 : 0}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="fretboardTuningIcon">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </aside>

            <button
                type="button"
                className={[
                    'fretboardCollapseFret',
                    isTuningCollapsed ? 'isCollapsed' : '',
                    isReversed ? 'isReversed' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
                aria-label={isTuningCollapsed ? 'Show tuning controls' : 'Hide tuning controls'}
                aria-expanded={!isTuningCollapsed}
                onClick={() => onToggleTuningCollapse?.()}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="fretboardCollapseIcon"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
                </svg>
            </button>
        </div>
    );

    return (
        <div className={["fretboardLayout", isReversed ? "isReversed" : "", className].filter(Boolean).join(' ')}>
            <div className="fretboardScrollerShell">
                <div
                    id="fretboardWrapper"
                    className="fretboardWrapper"
                    ref={wrapperRef}
                    onWheel={handleWheel}
                >
                    <div
                        id="fretboardContainer"
                        className={["fretboardContainer", isReversed ? "isReversed" : ""]
                            .filter(Boolean)
                            .join(' ')}
                        ref={containerRef}
                    >
                        {tuningControls}
                        {frets.map((fret) => (
                            <div key={fret} className="fretboardSection">
                                <div className="fretboardStrings" aria-hidden="true">
                                    {stringIndexes.map((_, lineIndex) => {
                                        const normalizedIndex =
                                            clampedStringCount > 1 ? lineIndex / (clampedStringCount - 1) : 0;
                                        const top = ((lineIndex + 0.5) / clampedStringCount) * 100;
                                        const thickness = 1.1 + normalizedIndex * 1.5;

                                        return (
                                            <span
                                                key={`string-line-${lineIndex}`}
                                                className="fretboardStringLine"
                                                style={{
                                                    top: `${top}%`,
                                                    height: `${thickness}px`,
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                                {getMarkerType(fret) !== 'none' ? (
                                    <div
                                        className={`fretboardMarker ${getMarkerType(fret) === 'double' ? 'fretboardMarkerDouble' : 'fretboardMarkerSingle'}`}
                                        aria-hidden="true"
                                    >
                                        <span />
                                        <span />
                                    </div>
                                ) : null}
                                <div className="fretboardColumn" data-fret={fret}>
                                    {stringIndexes.map((stringIndex) => {
                                        const midiNote = activeTuning[stringIndex] + fret;
                                        const noteName = NoteUtilities.getNoteName(midiNote, useSharps) ?? '';
                                        const octave = NoteUtilities.getOctave(midiNote);
                                        const fretSpacing = getFretWidth(fret);
                                        const inputId = `s${stringIndex}f${fret}`;
                                        const isChecked = selectedFrets?.[stringIndex] === fret;

                                        return (
                                            <div
                                                key={inputId}
                                                className={`fretboardCell string-${stringIndex}`}
                                                style={{ width: fretSpacing }}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`s${stringIndex}`}
                                                    value={fret}
                                                    id={inputId}
                                                    className="fretboardRadio"
                                                    data-midi={midiNote}
                                                    data-note={noteName}
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        if (!onStringFretChange) {
                                                            return;
                                                        }

                                                        onStringFretChange(stringIndex, fret);
                                                    }}
                                                    onClick={() => {
                                                        if (!onStringFretChange || !isChecked) {
                                                            return;
                                                        }

                                                        onStringFretChange(stringIndex, null);
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
                                <div className={fret === 0 ? 'nut' : 'fret'} />
                            </div>
                        ))}
                        <div className="fretboardSection fretboardStringsOnly">
                            <div className="fretboardStrings" aria-hidden="true">
                                {stringIndexes.map((_, lineIndex) => {
                                    const normalizedIndex =
                                        clampedStringCount > 1 ? lineIndex / (clampedStringCount - 1) : 0;
                                    const top = ((lineIndex + 0.5) / clampedStringCount) * 100;
                                    const thickness = 1.1 + normalizedIndex * 1.5;

                                    return (
                                        <span
                                            key={`string-line-${lineIndex}`}
                                            className="fretboardStringLine"
                                            style={{
                                                top: `${top}%`,
                                                height: `${thickness}px`,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="fretboardExternalScrollbar" ref={scrollbarRef} aria-hidden="true">
                    <div className="fretboardExternalScrollbarInner" ref={scrollbarInnerRef} />
                </div>
            </div>
        </div>
    );
}

export default Fretboard;