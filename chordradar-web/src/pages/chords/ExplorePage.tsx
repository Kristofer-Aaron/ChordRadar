/**
 * ExplorePage - Chord voicing explorer
 *
 * Helps users find all playable voicings (grip patterns) for a chord with constraints.
 * Inputs: root note, chord type, additions (M7/m7/9), slash note, grip span (1-5).
 * Returns: Sorted voicings from lowest to highest pitch, displayed as clickable grips
 * on the fretboard. Includes guitar customization (strings, tuning, handed) and playback.
 *
 * Algorithm: Builds chord note set → generates fretboard voicings → filters by span →
 * sorts by pitch register (min MIDI → avg MIDI → max MIDI) → displays clickable grips.
 *
 * State: rootNote, chordType, add, slashNote, gripSpan, geometry (strings/handed/tuning).
 */

import { useMemo, useState } from "react";
import "./chordPages.css";
import Fretboard from "../../components/fretboard/fretboard";
import { generateChordVoicings, NoteUtilities, playMidiChord, getMasterVolume, setMasterVolume } from "../../utils";
import { usePlaybackShortcut } from "../../hooks/usePlaybackShortcut";

const ROOT_OPTIONS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const CHORD_TYPES = ["maj", "min", "sus2", "sus4", "5", "dim", "aug"] as const;
const ADD_OPTIONS = ["", "M7", "m7", "9"] as const;

export default function ExplorePage() {
  // Chord definition state: root note (C-B), chord type (maj/min/sus/etc), added intervals (M7/m7/9).
  const [rootNote, setRootNote] = useState<(typeof ROOT_OPTIONS)[number]>("C");
  const [chordType, setChordType] = useState<(typeof CHORD_TYPES)[number]>("maj");
  const [add, setAdd] = useState<(typeof ADD_OPTIONS)[number]>("");
  
  // Slash notation support: allows chord/bass note (e.g., C/G means C chord with G in bass).
  const [slashNote, setSlashNote] = useState<"" | (typeof ROOT_OPTIONS)[number]>("");
  
  // Grip constraint: limits fret span between lowest and highest played frets (1-5 frets wide).
  const [gripSpan, setGripSpan] = useState(3);
  
  // Guitar geometry: string count (4-6), handedness (affects display), tuning per string (MIDI notes).
  const [stringCount, setStringCount] = useState(6);
  const [isLeftHanded, setIsLeftHanded] = useState(false);
  const [isTuningCollapsed, setIsTuningCollapsed] = useState(false);
  const [tuning, setTuning] = useState<number[]>(() => [...NoteUtilities.tuning]);
  
  // Fretboard selection: tracks which fret is selected on each string (null = open/muted).
  const [selectedFrets, setSelectedFrets] = useState<Array<number | null>>(() => Array.from({ length: 6 }, () => null));

  // Volume slider state: initialized from persisted localStorage value.
  const [volume, setVolumeState] = useState(() => getMasterVolume());

  // Sync React state and module-level masterVolume together.
  function handleVolumeChange(next: number) {
    setMasterVolume(next);
    setVolumeState(next);
  }

  const voicings = useMemo(() => {
    // Generate all playable voicings for the selected chord with the given grip span constraint.
    const activeTuning = tuning.slice(0, stringCount);
    // Convert MIDI note numbers to note names (e.g., 60 → "C") for voicing generator input.
    const tuningNames = tuning
      .slice(0, stringCount)
      .map((midiNote) => NoteUtilities.getNoteName(midiNote, true) ?? "C");

    // Request all possible voicings from the voicing generator (returns 2D array of frets).
    const rawVoicings: Array<Array<number | "x">> = generateChordVoicings({
      root: rootNote,
      triad: chordType,
      add,
      slash: slashNote,
      gripSpan,
      tuning: tuningNames,
    });

    // Helper to extract pitch metrics (min/avg/max MIDI) from a voicing for sorting.
    const getVoicingMetrics = (voicing: Array<number | "x">) => {
      // Map fret numbers to actual MIDI pitches, skip muted strings.
      const soundingMidis = voicing
        .map((fret, index) => {
          if (fret === "x") {
            return null;
          }
          const openString = activeTuning[index];
          return typeof openString === "number" ? openString + fret : null;
        })
        .filter((midi): midi is number => midi !== null);

      // If no strings sound (all muted), return infinite values to sort last.
      if (!soundingMidis.length) {
        return { min: Number.POSITIVE_INFINITY, avg: Number.POSITIVE_INFINITY, max: Number.POSITIVE_INFINITY };
      }

      // Calculate lowest pitch, highest pitch, and average pitch.
      const min = Math.min(...soundingMidis);
      const max = Math.max(...soundingMidis);
      const avg = soundingMidis.reduce((sum, midi) => sum + midi, 0) / soundingMidis.length;
      return { min, avg, max };
    };

    // Sort voicings from lowest to highest register (best playable first).
    // Primary: min MIDI (lowest note) - prefer lower positions.
    // Secondary: avg MIDI (overall pitch) - prefer lower voicings.
    // Tertiary: max MIDI (highest note) - tiebreaker.
    // Fallback: lexicographic order (string representation) for determinism.
    return rawVoicings.slice().sort((a: Array<number | "x">, b: Array<number | "x">) => {
      const left = getVoicingMetrics(a);
      const right = getVoicingMetrics(b);

      // Compare by lowest pitch first.
      if (left.min !== right.min) {
        return left.min - right.min;
      }
      // If same lowest note, compare by average pitch.
      if (left.avg !== right.avg) {
        return left.avg - right.avg;
      }
      // If same average, compare by highest pitch.
      if (left.max !== right.max) {
        return left.max - right.max;
      }
      // Deterministic tiebreaker: alphabetical by fret pattern (e.g., "0-2-3-1-x-0").
      return a.join("-").localeCompare(b.join("-"));
    });
  }, [rootNote, chordType, add, slashNote, gripSpan, stringCount, tuning]); // Recompute when chord/guitar config changes.

  const selectedMidis = useMemo(
    // Extract MIDI note numbers from selected frets for playback.
    () =>
      selectedFrets
        .map((fret, stringIndex) => {
          if (fret === null) {
            return null;
          }

          // Add fret number to open string MIDI note (e.g., 40 + 3 frets = 43).
          const openStringMidi = tuning[stringIndex] ?? NoteUtilities.tuning[stringIndex] ?? NoteUtilities.tuning[0];
          return openStringMidi + fret;
        })
        .filter((midi): midi is number => midi !== null),
    [selectedFrets, tuning], // Recompute when frets or tuning changes (converts to MIDI).
  );

  // Play the currently selected grip via Karplus-Strong synthesis.
  async function playSelection() {
    // Only play if at least one string is selected.
    if (selectedMidis.length === 0) {
      return;
    }
    // Trigger async synth playback.
    await playMidiChord(selectedMidis);
  }

  // Attach keyboard shortcut (default: Space) to trigger playback.
  usePlaybackShortcut(playSelection);

  // When string count changes, update frets array and extend/trim tuning to match.
  function handleStringCountChange(nextCount: number) {
    setStringCount(nextCount);
    // Keep existing fret selections for strings that remain; pad new strings with nulls.
    setSelectedFrets((current) => Array.from({ length: nextCount }, (_, index) => current[index] ?? null));
    // Preserve custom tunings for kept strings; fill new strings with standard tuning.
    setTuning((current) => {
      const base = [...NoteUtilities.tuning];
      return Array.from({ length: nextCount }, (_, index) => current[index] ?? base[index] ?? base[0]);
    });
  }

  return (
    <main className="page-shell">
      <section className="tool-card selector-panel">
        <h2>Select Chord</h2>

        <div className="selector-grid">
          <div className="selector-block">
            <span className="selector-label">Root Note</span>
            {/* Radio button group: selects C through B (12 notes per octave). */}
            <div className="choice-group" role="radiogroup" aria-label="Root note">
              {ROOT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={["choice-button", rootNote === option ? "isActive" : ""].filter(Boolean).join(" ")}
                  onClick={() => setRootNote(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="selector-block">
            <span className="selector-label">Chord Type</span>
            {/* Radio button group: selects triad type (major, minor, diminished, augmented, sus, power). */}
            <div className="choice-group" role="radiogroup" aria-label="Chord type">
              {CHORD_TYPES.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={["choice-button", chordType === option ? "isActive" : ""].filter(Boolean).join(" ")}
                  onClick={() => setChordType(option)}
                >
                  {option === "maj" ? "Maj" : option === "min" ? "Min" : option}
                </button>
              ))}
            </div>
          </div>

          <div className="selector-block">
            <span className="selector-label">Add</span>
            {/* Radio button group: optionally adds M7, m7, or 9 intervals to the triad. */}
            <div className="choice-group" role="radiogroup" aria-label="Added interval">
              {ADD_OPTIONS.map((option) => (
                <button
                  key={option || "none"}
                  type="button"
                  className={["choice-button", add === option ? "isActive" : ""].filter(Boolean).join(" ")}
                  onClick={() => setAdd(option)}
                >
                  {option || "None"}
                </button>
              ))}
            </div>
          </div>

          <div className="selector-block">
            <span className="selector-label">Slash Note</span>
            {/* Radio button group: optionally sets bass note (chord/bass), adds "None" first then all 12 notes. */}
            <div className="choice-group" role="radiogroup" aria-label="Slash note">
              <button
                type="button"
                className={["choice-button", slashNote === "" ? "isActive" : ""].filter(Boolean).join(" ")}
                onClick={() => setSlashNote("")}
              >
                None
              </button>
              {ROOT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={["choice-button", slashNote === option ? "isActive" : ""].filter(Boolean).join(" ")}
                  onClick={() => setSlashNote(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="selector-block">
            <span className="selector-label">Grip Span</span>
            {/* Radio button group: limits fret width from 1 (all on same fret) to 5 (wide stretch). */}
            <div className="choice-group" role="radiogroup" aria-label="Grip span">
              {[1, 2, 3, 4, 5].map((span) => (
                <button
                  key={span}
                  type="button"
                  className={["choice-button", gripSpan === span ? "isActive" : ""].filter(Boolean).join(" ")}
                  onClick={() => setGripSpan(span)}
                >
                  {span}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="tool-card fretboard-card">
        <div className="toolbar-row">
          {/* Play button: auditions the current grip selection via Karplus-Strong synth. */}
          <button
            type="button"
            className="icon-btn"
            title="Play"
            aria-label="Play"
            onClick={playSelection}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z" />
              <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z" />
              <path d="M10.025 8a4.5 4.5 0 0 1-1.318 3.182L8 10.475A3.5 3.5 0 0 0 9.025 8c0-.966-.392-1.841-1.025-2.475l.707-.707A4.5 4.5 0 0 1 10.025 8" />
              <path d="M7 4a.5.5 0 0 0-.812-.39L3.825 5.5H1.5A.5.5 0 0 0 1 6v4a.5.5 0 0 0 .5.5h2.325l2.363 1.89A.5.5 0 0 0 7 12z" />
            </svg>
          </button>

          {/* String count input: allows 4-6 strings (common guitar variations). */}
          <label className="toolbar-inline-label">
            Strings
            <input
              type="number"
              min={4}
              max={6}
              value={stringCount}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                const nextCount = Math.max(4, Math.min(6, Number.isFinite(nextValue) ? nextValue : 6));
                handleStringCountChange(nextCount);
              }}
            />
          </label>

          {/* Hand preference toggle: flips fretboard display horizontally for left-handed play. */}
          <button type="button" className="toolbar-toggle-btn" onClick={() => setIsLeftHanded((prev) => !prev)}>
            {isLeftHanded ? "Left-handed" : "Right-handed"}
          </button>

          {/* Volume slider: adjusts Karplus-Strong gain multiplier (0–100%). */}
          <label className="toolbar-inline-label">
            Vol
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              aria-label="Volume"
              title={`Volume: ${Math.round(volume * 100)}%`}
            />
          </label>
        </div>

        {/* Interactive fretboard: controlled component that displays fret selections and tuning panel. */}
        <Fretboard
          fretCount={24}
          stringCount={stringCount}
          isReversed={isLeftHanded}
          isTuningCollapsed={isTuningCollapsed}
          onToggleTuningCollapse={() => setIsTuningCollapsed((prev) => !prev)}
          selectedFrets={selectedFrets}
          onStringFretChange={(stringIndex, fret) => {
            setSelectedFrets((current) => {
              const next = [...current];
              next[stringIndex] = fret;
              return next;
            });
          }}
          tuning={tuning}
          onTuningChange={setTuning}
        />
      </section>

      <section className="tool-card">
        <h2>Found Grips</h2>
        {/* Show a message if no voicings exist for the selected chord configuration. */}
        {/* Otherwise, render clickable grip badges (fret patterns like "0-2-3-1-x-0"). */}
        {!voicings.length ? (
          <p className="muted-copy">No voicings found for this chord.</p>
        ) : (
          <div className="found-grips-grid">
            {voicings.map((voicing: Array<number | "x">) => {
              // Format voicing as readable string (e.g., "0-2-3-1-x-0" for grip pattern).
              const label = voicing.join("-");
              return (
                // Clicking a badge applies that voicing to the fretboard selection.
                <button
                  key={label}
                  type="button"
                  className={["chord-badge", "grip-badge", selectedFrets.map((fret) => (fret === null ? 'x' : fret)).join("-") === label ? "isActive" : ""].join(" ")}
                  onClick={() => setSelectedFrets(voicing.map((fret: number | "x") => (fret === 'x' ? null : fret)))}
                >
                  {/* Display fret pattern inline (e.g., "0 2 3 1 x 0" with visual formatting). */}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
