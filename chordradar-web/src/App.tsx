import { useEffect, useCallback, useState } from "react";
import "./App.css";
import "./features/auth/authModal.css";
import Navbar from "./components/navbar/navbar";
import AuthController from "./services/authController";
import SignInModal from "./features/auth/SignInModal";
import SignInTotpPage from "./features/auth/SignInTotpPage";
import SignUpModal from "./features/auth/SignUpModal";
import SettingsModal from "./features/auth/SettingsModal";
import Processor from "./components/modules/processor";
import type { FoundChord } from "./components/modules/processor";
import Fretboard from "./components/modules/fretboard";
import { midisToChords } from "./utils/chordAnalysis";
import { generateChordVoicings } from "./utils/chordExploration";
import { NoteUtilities } from "./utils/noteUtilities";

type RouteName = 'home' | 'sign-in' | 'sign-in-totp' | 'sign-up' | 'settings';

function normalizeChordNotation(chord: string): string {
  const raw = chord.trim();
  if (!raw) {
    return '';
  }

  // Legacy DB format examples: E-min--, D-maj--A
  if (raw.includes('-')) {
    const parts = raw.split('-');
    const root = (parts[0] ?? '').trim();
    const triad = (parts[1] ?? '').trim();
    const add = (parts[2] ?? '').trim();
    const slash = (parts[3] ?? '').trim();

    if (root) {
      return `${root}${triad}${add ? `Add:${add}` : ''}${slash ? `/${slash}` : ''}`;
    }
  }

  return raw;
}

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
  const [foundChords, setFoundChords] = useState<FoundChord[]>([]);
  const [exploreExternalFrets, setExploreExternalFrets] = useState<Record<number, number | null> | null>(null);

  const navigateTo = useCallback((hash: string) => {
    setRoute(resolveRouteFromHash(hash));
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  }, []);

  const consumeAuthCallbackHash = useCallback((): boolean => {
    const [hashPath, hashQuery = ''] = window.location.hash.split('?');
    if (hashPath !== '#/auth/callback') {
      return false;
    }

    const params = new URLSearchParams(hashQuery);
    const token = params.get('token');
    const email = params.get('email');

    if (!token) {
      navigateTo('#/sign-in');
      return true;
    }

    AuthController.setToken(token);
    if (email) {
      AuthController.setEmail(email);
    }

    setIsAuthenticated(true);
    navigateTo('#/');
    return true;
  }, [navigateTo]);

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
      if (consumeAuthCallbackHash()) {
        return;
      }
      setRoute(resolveRouteFromHash(window.location.hash));
    }

    onHashChange();
    window.addEventListener("storage", onStorageChange);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("storage", onStorageChange);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [consumeAuthCallbackHash]);

  async function handleLogout() {
    try {
      await AuthController.logout();
    } catch {
      AuthController.clearSession();
    }
    setIsAuthenticated(false);
    navigateTo('#/');
  }

  useEffect(() => {
    let active = true;

    async function refreshFoundChords() {
      if (fretboard2Midis.length === 0) {
        setFoundChords([]);
        return;
      }

      const algorithmUnique = Array.from(
        new Set(midisToChords(fretboard2Midis).map(normalizeChordNotation).filter((value) => value.length > 0)),
      );

      try {
        const fieldsQuery = encodeURIComponent(JSON.stringify({ notation: 'value' }));
        const response = await fetch(`${AuthController.baseUrl}/api/chords?fields=${fieldsQuery}`);
        const rows = (await response.json()) as Array<{ notation?: string }>;
        const dbNotationSet = new Set(
          rows
            .map((row) => row.notation)
            .filter((notation): notation is string => typeof notation === 'string' && notation.length > 0)
            .map((notation) => normalizeChordNotation(notation))
            .filter((notation) => notation.length > 0),
        );

        const dbMatches: FoundChord[] = [];
        const algorithmOnly: FoundChord[] = [];

        for (const chordName of algorithmUnique) {
          if (dbNotationSet.has(chordName)) {
            dbMatches.push({ name: chordName, source: 'db' });
          } else {
            algorithmOnly.push({ name: chordName, source: 'algorithm' });
          }
        }

        if (active) {
          setFoundChords([...dbMatches, ...algorithmOnly]);
        }
      } catch {
        if (active) {
          setFoundChords(algorithmUnique.map((name) => ({ name, source: 'algorithm' } satisfies FoundChord)));
        }
      }
    }

    void refreshFoundChords();
    return () => {
      active = false;
    };
  }, [fretboard2Midis]);

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
              foundChords={foundChords}
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

