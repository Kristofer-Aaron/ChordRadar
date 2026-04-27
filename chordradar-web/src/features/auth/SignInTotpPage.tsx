import { useState } from "react";
import type { FormEvent } from "react";
import AuthController from "../../services/authController";
import type { ApiError } from "../../services/authController";

type SignInTotpPageProps = {
  onSignedIn: () => void;
  onSwitchToPassword?: () => void;
  onSwitchToSignUp?: () => void;
};

export default function SignInTotpPage({ onSignedIn, onSwitchToPassword, onSwitchToSignUp }: SignInTotpPageProps) {
  const [emailAddress, setEmailAddress] = useState(AuthController.getEmail() ?? "");
  const [totpToken, setTotpToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      await AuthController.loginTotp({
        emailAddress,
        totpToken,
      });
      onSignedIn();
      window.location.hash = "#/";
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError?.message || "TOTP sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-card glass">
        <h2>TOTP sign in</h2>
        <p className="auth-muted">Use your email and 6-digit authenticator code.</p>

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
            TOTP code
            <input
              type="text"
              value={totpToken}
              onChange={(event) => setTotpToken(event.target.value)}
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
            />
          </label>

          {errorMessage ? <div className="auth-error">{errorMessage}</div> : null}

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in with TOTP"}
          </button>
        </form>

        <p className="auth-switch">
          Want to use your password?{' '}
          {onSwitchToPassword
            ? <button type="button" className="auth-switch-btn" onClick={onSwitchToPassword}>Use password sign in</button>
            : <a href="#/sign-in">Use password sign in</a>
          }
        </p>

        <p className="auth-switch">
          Need an account?{' '}
          {onSwitchToSignUp
            ? <button type="button" className="auth-switch-btn" onClick={onSwitchToSignUp}>Create one</button>
            : <a href="#/sign-up">Create one</a>
          }
        </p>
      </div>
    </section>
  );
}
