import { useEffect, useCallback, useMemo, useState } from "react";
import "./App.css";
import "./features/auth/authModal.css";
import Navbar from "./components/navbar/navbar";
import AuthController from "./services/authController";
import SignInModal from "./features/auth/SignInModal";
import SignInTotpPage from "./features/auth/SignInTotpPage";
import SignUpModal from "./features/auth/SignUpModal";
import SettingsModal from "./features/auth/SettingsModal";
import Processor from "./components/modules/processor";
import Fretboard from "./components/modules/fretboard";
import { midisToChords } from "./utils/chordAnalysis";
import { generateChordVoicings } from "./utils/chordExploration";
import { NoteUtilities } from "./utils/noteUtilities";

type RouteName = 'home' | 'sign-in' | 'sign-in-totp' | 'sign-up' | 'settings';

function resolveRouteFromHash(hashValue: string): RouteName {
  const normalized = hashValue.split('?')[0].replace(/\/+$/, '');

  if (normalized === '#/sign-in') return 'sign-in';
  if (normalized === '#/sign-in/totp') return 'sign-in-totp';
  if (normalized === '#/sign-up') return 'sign-up';
  if (normalized === '#/settings') return 'settings';
  return 'home';
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(AuthController.isAuthenticated());
  const [route, setRoute] = useState<RouteName>(() => resolveRouteFromHash(window.location.hash));
  const [fretboard2Midis, setFretboard2Midis] = useState<number[]>([]);
  const [exploreExternalFrets, setExploreExternalFrets] = useState<Record<number, number | null> | null>(null);

  const navigateTo = useCallback((hash: string) => {
    setRoute(resolveRouteFromHash(hash));
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  }, []);

  const openSignIn = useCallback(() => {
    navigateTo('#/sign-in');
  }, [navigateTo]);
  const openSignUp = useCallback(() => {
    navigateTo('#/sign-up');
  }, [navigateTo]);
  const openSettings = useCallback(() => {
    navigateTo('#/settings');
  }, [navigateTo]);

  useEffect(() => {
    function onStorageChange(event: StorageEvent) {
      if (event.key === "chordradar.authToken") {
        setIsAuthenticated(AuthController.isAuthenticated());
      }
    }

    function onHashChange() {
      setRoute(resolveRouteFromHash(window.location.hash));
    }

    window.addEventListener("storage", onStorageChange);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("storage", onStorageChange);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  async function handleLogout() {
    try {
      await AuthController.logout();
    } catch {
      AuthController.clearSession();
    }
    setIsAuthenticated(false);
    navigateTo('#/');
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

  useEffect(() => {
    if (route === 'settings' && !isAuthenticated) {
      if (window.location.hash !== '#/sign-in') {
        window.location.hash = '#/sign-in';
      }
    }
  }, [route, isAuthenticated]);

  const content = route === 'sign-in'
    ? (
      <SignInModal
        onSignedIn={() => {
          setIsAuthenticated(true);
          navigateTo('#/');
        }}
        onSwitchToTotp={() => {
          navigateTo('#/sign-in/totp');
        }}
        onSwitchToSignUp={() => {
          navigateTo('#/sign-up');
        }}
      />
    )
    : route === 'sign-in-totp'
      ? (
        <SignInTotpPage
          onSignedIn={() => {
            setIsAuthenticated(true);
            navigateTo('#/');
          }}
          onSwitchToPassword={() => {
            navigateTo('#/sign-in');
          }}
          onSwitchToSignUp={() => {
            navigateTo('#/sign-up');
          }}
        />
      )
    : route === 'sign-up'
      ? (
        <SignUpModal
          onRegistered={() => {
            navigateTo('#/sign-in');
          }}
          onSwitchToSignIn={() => {
            navigateTo('#/sign-in');
          }}
        />
      )
      : route === 'settings'
        ? (
          <SettingsModal
            onDeleted={() => {
              setIsAuthenticated(false);
              navigateTo('#/sign-in');
            }}
          />
        )
        : (
          <main className="page-shell">
            <Processor
              mode="analyze"
              foundChords={fretboard2Chords}
              selectedMidis={fretboard2Midis}
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
        );

  return (
    <>
      <Navbar
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onOpenSignIn={openSignIn}
        onOpenSignUp={openSignUp}
        onOpenSettings={openSettings}
      />
      {content}
    </>
  );
}

export default App;

