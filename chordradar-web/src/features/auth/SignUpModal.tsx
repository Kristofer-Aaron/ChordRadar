import { useState } from "react";
import type { FormEvent } from "react";
import AuthController from "../../services/authController";
import type { ApiError } from "../../services/authController";

type SignUpModalProps = {
  onRegistered: () => void;
  onSwitchToSignIn?: () => void;
};

export default function SignUpModal({ onRegistered, onSwitchToSignIn }: SignUpModalProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    emailAddress: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await AuthController.register({
        firstName: form.firstName,
        lastName: form.lastName,
        userName: form.userName,
        emailAddress: form.emailAddress,
        password: form.password,
      });

      setSuccessMessage("Registration successful. Check your email to verify your account.");
      onRegistered();
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError?.message || "Sign up failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-card glass">
        <h2>Create account</h2>
        <p className="auth-muted">Join ChordRadar and save your progress.</p>

        <form onSubmit={onSubmit} className="auth-form">
          <label>
            First name
            <input
              type="text"
              value={form.firstName}
              onChange={(event) => setField("firstName", event.target.value)}
              required
            />
          </label>

          <label>
            Last name
            <input
              type="text"
              value={form.lastName}
              onChange={(event) => setField("lastName", event.target.value)}
              required
            />
          </label>

          <label>
            Username
            <input
              type="text"
              value={form.userName}
              onChange={(event) => setField("userName", event.target.value)}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={form.emailAddress}
              onChange={(event) => setField("emailAddress", event.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setField("password", event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setField("confirmPassword", event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          {errorMessage ? <div className="auth-error">{errorMessage}</div> : null}
          {successMessage ? <div className="auth-success">{successMessage}</div> : null}

          <div className="auth-form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? "Creating account..." : "Sign up"}
            </button>
          </div>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          {onSwitchToSignIn
            ? <button type="button" className="auth-switch-btn" onClick={onSwitchToSignIn}>Sign in</button>
            : <a href="#/sign-in">Sign in</a>
          }
        </p>
      </div>
    </section>
  );
}
