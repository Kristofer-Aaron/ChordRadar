import { useEffect, useCallback, useMemo, useState } from "react";
import "./App.css";
import "./features/auth/authModal.css";
import Navbar from "./components/navbar/navbar";
import AuthController from "./services/authController";
import SignInModal from "./features/auth/SignInModal";
import SignUpModal from "./features/auth/SignUpModal";
import Processor from "./components/modules/processor";
import Fretboard from "./components/modules/fretboard";
import { midisToChords } from "./utils/chordAnalysis";
import { generateChordVoicings } from "./utils/chordExploration";
import { NoteUtilities } from "./utils/noteUtilities";

type AuthModal = 'sign-in' | 'sign-up' | null;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(AuthController.isAuthenticated());
  const [authModal, setAuthModal] = useState<AuthModal>(null);
  const [fretboard2Midis, setFretboard2Midis] = useState<number[]>([]);
  const [exploreExternalFrets, setExploreExternalFrets] = useState<Record<number, number | null> | null>(null);

  const openSignIn = useCallback(() => setAuthModal('sign-in'), []);
  const openSignUp = useCallback(() => setAuthModal('sign-up'), []);
  const closeModal = useCallback(() => setAuthModal(null), []);

  useEffect(() => {
    function onStorageChange(event: StorageEvent) {
      if (event.key === "chordradar.authToken") {
        setIsAuthenticated(AuthController.isAuthenticated());
      }
    }
    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, []);

  async function handleLogout() {
    try {
      await AuthController.logout();
    } catch {
      AuthController.clearSession();
    }
    setIsAuthenticated(false);
  }

  const fretboard2Chords = useMemo(() => midisToChords(fretboard2Midis), [fretboard2Midis]);

  function handleGripSelect(voicing: Array<number | 'x'>) {
    const frets: Record<number, number | null> = {};
    voicing.forEach((fret, stringIndex) => {
      frets[stringIndex] = fret === 'x' ? null : fret;
    });
    setExploreExternalFrets(frets);
  }

  function parseAndSelectChord(chordName: string) {
    const ROOT_OPTIONS = ['C#', 'D#', 'F#', 'G#', 'A#', 'C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
    const CHORD_TYPES = ['sus2', 'sus4', 'maj', 'min', 'dim', 'aug', '5', ''] as const;
    const ADD_MAP: Record<string, string> = { M7: 'M7', m7: 'm7', M2: '9' };

    let rest = chordName;
    let root = '';
    for (const r of ROOT_OPTIONS) {
      if (rest.startsWith(r)) { root = r; rest = rest.slice(r.length); break; }
    }
    if (!root) return;

    let triad = '';
    for (const t of CHORD_TYPES) {
      if (rest.startsWith(t)) { triad = t; rest = rest.slice(t.length); break; }
    }

    let add = '';
    const addMatch = rest.match(/Add:([^/]+)/);
    if (addMatch) {
      const firstAdd = addMatch[1].split(',')[0] ?? '';
      add = ADD_MAP[firstAdd] ?? '';
      rest = rest.replace(/Add:[^/]+/, '');
    }

    let slash = '';
    const slashMatch = rest.match(/\/([A-G]#?)/);
    if (slashMatch) slash = slashMatch[1] ?? '';

    const tuningNames = [...NoteUtilities.tuning].map(
      (midi) => NoteUtilities.getNoteName(midi, true) ?? 'C',
    );
    const voicings = generateChordVoicings({
      root: root as typeof ROOT_OPTIONS[number],
      triad: triad as 'maj' | 'min' | 'sus2' | 'sus4' | '5' | 'dim' | 'aug',
      add: add as '' | 'M7' | 'm7' | '9',
      slash: slash as '' | typeof ROOT_OPTIONS[number],
      gripSpan: 3,
      tuning: tuningNames,
    });
    if (voicings.length > 0) handleGripSelect(voicings[0]);
  }

  return (
    <>
      <Navbar
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onOpenSignIn={openSignIn}
        onOpenSignUp={openSignUp}
      />
      <main className="page-shell">
        <Processor
          mode="analyze"
          foundChords={fretboard2Chords}
          isAuthenticated={isAuthenticated}
          onGripSelect={handleGripSelect}
          onSavedChordSelect={parseAndSelectChord}
        />
        <Fretboard
          onSelectedMidisChange={setFretboard2Midis}
          externalFrets={exploreExternalFrets}
          onFretUserChange={() => setExploreExternalFrets(null)}
        />
      </main>
      {authModal !== null && (
        <div className="auth-modal-overlay" onClick={closeModal}>
          <div className="auth-modal-panel glass" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="auth-modal-close" onClick={closeModal} aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
            {authModal === 'sign-in' ? (
              <SignInModal
                onSignedIn={() => { setIsAuthenticated(true); closeModal(); }}
                onSwitchToSignUp={() => setAuthModal('sign-up')}
              />
            ) : (
              <SignUpModal
                onRegistered={closeModal}
                onSwitchToSignIn={() => setAuthModal('sign-in')}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default App;

