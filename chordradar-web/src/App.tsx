/**
 * Main application component for ChordRadar.
 * Handles client-side routing via URL hash (#/analyze, #/explore, #/sign-in, #/sign-up).
 * Manages global authentication state and listens for storage changes to sync auth status.
 * Renders the navbar and route-specific content page.
 *
 * Routes:
 * - #/ or #/analyze: Chord analyzer (select frets, detect chord names, play audio)
 * - #/explore: Chord explorer (search voicings for chords with grip span constraint)
 * - #/sign-in: Sign in page
 * - #/sign-up: User registration page
 */

import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Navbar from "./components/navbar/navbar";
import AuthController from "./services/authController";
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import AnalyzePage from "./pages/chords/AnalyzePage";
import ExplorePage from "./pages/chords/ExplorePage";

function getHashRoute(): string {
  const hash = window.location.hash || "#/";
  const route = hash.replace(/^#/, "");
  return route || "/";
}

function App() {
  const [route, setRoute] = useState<string>(getHashRoute());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(AuthController.isAuthenticated());

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

    if (route === "/sign-in") {
      return <SignInPage onSignedIn={() => setIsAuthenticated(true)} />;
    }

    if (route === "/sign-up") {
      return <SignUpPage onRegistered={() => void 0} />;
    }

    return <AnalyzePage />;
  }, [route]);

  return (
    <>
      <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      {content}
    </>
  );
}

export default App
