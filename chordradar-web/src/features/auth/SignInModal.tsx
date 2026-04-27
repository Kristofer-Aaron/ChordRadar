import { useState } from "react";
import type { FormEvent } from "react";
import AuthController from "../../services/authController";
import type { ApiError } from "../../services/authController";

type SignInModalProps = {
  onSignedIn: () => void;
  onSwitchToSignUp?: () => void;
  onSwitchToTotp?: () => void;
};

export default function SignInModal({ onSignedIn, onSwitchToSignUp, onSwitchToTotp }: SignInModalProps) {
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      await AuthController.login({
        emailAddress,
        password,
        rememberMe,
      });
      onSignedIn();
      window.location.hash = "#/";
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError?.message || "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-card glass">
        <h2>Sign in</h2>
        <p className="auth-muted">Use your ChordRadar account to continue.</p>

        <form onSubmit={onSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <label className="auth-checkbox auth-remember-section">
            <span>Remember me</span>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
          </label>

          {errorMessage ? <div className="auth-error">{errorMessage}</div> : null}

          <div className="auth-form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <p className="auth-switch">
          TOTP enabled?{' '}
          {onSwitchToTotp
            ? <button type="button" className="auth-switch-btn" onClick={onSwitchToTotp}>Sign in with authenticator app</button>
            : <a href="#/sign-in/totp">Sign in with authenticator app</a>
          }
        </p>

        <p className="auth-switch">
          Don't have an account?{' '}
          {onSwitchToSignUp
            ? <button type="button" className="auth-switch-btn" onClick={onSwitchToSignUp}>Create one</button>
            : <a href="#/sign-up">Create one</a>
          }
        </p>
      </div>
    </section>
  );
}
