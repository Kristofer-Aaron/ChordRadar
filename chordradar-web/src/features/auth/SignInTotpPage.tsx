import { useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
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
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const totpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function focusTotpInput(index: number) {
    const input = totpInputRefs.current[index];
    if (input) input.focus();
  }

  function applyTotpDigits(startIndex: number, rawValue: string) {
    const digits = rawValue.replace(/\D/g, "");
    if (!digits) {
      setTotpToken((prev) => {
        const next = Array.from({ length: 6 }, (_, index) => prev[index] ?? "");
        next[startIndex] = "";
        return next.join("");
      });
      return;
    }

    setTotpToken((prev) => {
      const next = Array.from({ length: 6 }, (_, index) => prev[index] ?? "");
      for (let offset = 0; offset < digits.length && startIndex + offset < 6; offset += 1) {
        next[startIndex + offset] = digits[offset];
      }
      return next.join("");
    });

    const nextIndex = Math.min(startIndex + digits.length, 5);
    focusTotpInput(nextIndex);
  }

  function onTotpKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !totpToken[index] && index > 0) {
      focusTotpInput(index - 1);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusTotpInput(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      focusTotpInput(index + 1);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      await AuthController.loginTotp({
        emailAddress,
        totpToken,
        rememberMe,
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
        <h2>Sign in</h2>
        <p className="auth-muted">Sign in with TOTP authenticator code.</p>

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
            Authenticator code
            <div className="otp-input-group" role="group" aria-label="Authenticator code">
              {Array.from({ length: 6 }, (_, index) => (
                <input
                  key={`totp-signin-digit-${index}`}
                  ref={(element) => {
                    totpInputRefs.current[index] = element;
                  }}
                  className="otp-digit-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={totpToken[index] ?? ""}
                  onChange={(event) => applyTotpDigits(index, event.target.value)}
                  onKeyDown={(event) => onTotpKeyDown(index, event)}
                  onPaste={(event) => {
                    event.preventDefault();
                    applyTotpDigits(index, event.clipboardData.getData("text"));
                  }}
                  aria-label={`TOTP digit ${index + 1}`}
                  required
                />
              ))}
            </div>
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
              {submitting ? "Signing in..." : "Sign in with TOTP"}
            </button>
          </div>
        </form>

        <p className="auth-switch">
          TOTP not working?{' '}
          {onSwitchToPassword
            ? <button type="button" className="auth-switch-btn" onClick={onSwitchToPassword}>Use password to sign in</button>
            : <a href="#/sign-in">Use password to sign in</a>
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
