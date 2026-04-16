/**
 * Main application component for ChordRadar.
 * Handles client-side routing via URL hash (#/analyze, #/explore).
 * Manages global authentication state and listens for storage changes to sync auth status.
 * Renders the navbar and route-specific content page.
 *
 * Routes:
 * - #/ or #/analyze: Chord analyzer (select frets, detect chord names, play audio)
 * - #/explore: Chord explorer (search voicings for chords with grip span constraint)
 * Authentication is shown in modal form from the navbar.
 */

import { useEffect, useMemo, useCallback, useState } from "react";
import "./App.css";
import "./features/auth/authModal.css";
import Navbar from "./components/navbar/navbar";
import AuthController from "./services/authController";
import SignInModal from "./features/auth/SignInModal";
import SignUpModal from "./features/auth/SignUpModal";
import AnalyzePage from "./pages/chords/AnalyzePage";
import ExplorePage from "./pages/chords/ExplorePage";

type AuthModal = 'sign-in' | 'sign-up' | null;

function getHashRoute(): string {
  const hash = window.location.hash || "#/";
  const route = hash.replace(/^#/, "");
  return route || "/";
}

function App() {
  const [route, setRoute] = useState<string>(getHashRoute());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(AuthController.isAuthenticated());
  const [authModal, setAuthModal] = useState<AuthModal>(null);

  const openSignIn = useCallback(() => setAuthModal('sign-in'), []);
  const openSignUp = useCallback(() => setAuthModal('sign-up'), []);
  const closeModal = useCallback(() => setAuthModal(null), []);

  useEffect(() => {
    function onHashChange() {
      setRoute(getHashRoute());
    }

    function onStorageChange(event: StorageEvent) {
      if (event.key === "chordradar.authToken") {
        setIsAuthenticated(AuthController.isAuthenticated());
      }
    }

    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("storage", onStorageChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("storage", onStorageChange);
    };
  }, []);

  async function handleLogout() {
    try {
      await AuthController.logout();
    } catch {
      AuthController.clearSession();
    }
    setIsAuthenticated(false);
    window.location.hash = "#/";
  }

  const content = useMemo(() => {
    if (route === "/" || route === "/analyze") {
      return <AnalyzePage />;
    }

    if (route === "/explore") {
      return <ExplorePage />;
    }

    return <AnalyzePage />;
  }, [route]);

  return (
    <>
      <Navbar
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onOpenSignIn={openSignIn}
        onOpenSignUp={openSignUp}
      />
      {content}
      {authModal !== null && (
        <div className="auth-modal-overlay" onClick={closeModal}>
          <div className="auth-modal-panel" onClick={(e) => e.stopPropagation()}>
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

export default App
