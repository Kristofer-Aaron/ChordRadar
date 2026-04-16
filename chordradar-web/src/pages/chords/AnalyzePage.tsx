/**
 * AnalyzePage - Interactive chord analyzer
 *
 * Allows users to select frets on an interactive fretboard and displays detected chord
 * names in real-time. Features guitar customization (string count, left/right-handed), 
 * custom tuning, and playback via Karplus-Strong synthesis.
 *
 * State: selectedFrets (fret selections per string), tuning (MIDI note per open string),
 * stringCount (4-6), isLeftHanded (display mode).
 * 
 * Exports: Detected chord names as badges; playback button for audio audition.
 */

import { useMemo, useState } from "react";
import "./chordPages.css";
import Fretboard from "../../components/fretboard/fretboard";
import { midisToChords, NoteUtilities, playMidiChord, getMasterVolume, setMasterVolume } from "../../utils";
import { usePlaybackShortcut } from "../../hooks/usePlaybackShortcut";

export default function AnalyzePage() {
  const [stringCount, setStringCount] = useState(6);
  const [isLeftHanded, setIsLeftHanded] = useState(false);
  const [isTuningCollapsed, setIsTuningCollapsed] = useState(false);
  const [tuning, setTuning] = useState<number[]>(() => [...NoteUtilities.tuning]);
  const [selectedFrets, setSelectedFrets] = useState<Array<number | null>>(
    () => Array.from({ length: 6 }, () => null),
  );

  // Volume slider state: initialized from persisted localStorage value.
  const [volume, setVolumeState] = useState(() => getMasterVolume());

  // Sync React state and module-level masterVolume together.
  function handleVolumeChange(next: number) {
    setMasterVolume(next);
    setVolumeState(next);
  }

  const selectedMidis = useMemo(
    () =>
      selectedFrets
        .map((fret, stringIndex) => {
          if (fret === null) {
            return null;
          }

          const openStringMidi = tuning[stringIndex] ?? NoteUtilities.tuning[stringIndex] ?? NoteUtilities.tuning[0];
          return openStringMidi + fret;
        })
        .filter((midi): midi is number => midi !== null),
    [selectedFrets, tuning],
  );

  const possibleChords = useMemo(() => midisToChords(selectedMidis), [selectedMidis]);

  const hasResults = possibleChords.length > 0;

  async function playSelection() {
    if (selectedMidis.length === 0) {
      return;
    }

    await playMidiChord(selectedMidis);
  }

  // Attach keyboard shortcut (default: Space) to trigger playback.
  usePlaybackShortcut(playSelection);

  return (
    <main className="page-shell">
      <section className="tool-card fretboard-card">
        <div className="toolbar-row">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSelectedFrets(Array.from({ length: stringCount }, () => null))}
            title="Reset"
            aria-label="Reset"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2z" />
              <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466" />
            </svg>
          </button>

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
                setStringCount(nextCount);
                setSelectedFrets((current) => {
                  const next = Array.from({ length: nextCount }, (_, index) => current[index] ?? null);
                  return next;
                });
                setTuning((current) => {
                  const base = [...NoteUtilities.tuning];
                  return Array.from({ length: nextCount }, (_, index) => current[index] ?? base[index] ?? base[0]);
                });
              }}
            />
          </label>

          <button
            type="button"
            className="toolbar-toggle-btn"
            onClick={() => setIsLeftHanded((prev) => !prev)}
          >
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

      <section className="grid-card">
        <article className="tool-card">
          <h2>Possible Chords</h2>
          {!hasResults ? (
            <p className="muted-copy">Enter a chord in the fretboard.</p>
          ) : (
            <div className="badge-list">
              {possibleChords.map((chord) => (
                <span key={chord} className="chord-badge">
                  {chord}
                </span>
              ))}
            </div>
          )}
        </article>

      </section>
    </main>
  );
}
