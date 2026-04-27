import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import AuthController from "../../services/authController";
import type { ApiError, UserProfile } from "../../services/authController";

type SettingsModalProps = {
  onDeleted: () => void;
};

type ProfileForm = {
  userName: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
};

function toProfileForm(user: UserProfile): ProfileForm {
  return {
    userName: user.user_name,
    firstName: user.first_name,
    lastName: user.last_name,
    emailAddress: user.email_address,
  };
}

export default function SettingsModal({ onDeleted }: SettingsModalProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [form, setForm] = useState<ProfileForm>({
    userName: "",
    firstName: "",
    lastName: "",
    emailAddress: "",
  });
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [totpBusy, setTotpBusy] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpSuccess, setTotpSuccess] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const disableInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const canDeleteAccount = deleteConfirm.trim() === "DELETE";

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const current = await AuthController.getCurrentUser();
        if (!active) return;
        setUser(current);
        setForm(toProfileForm(current));
      } catch (error) {
        if (!active) return;
        const apiError = error as ApiError;
        setProfileError(apiError?.message || "Failed to load settings.");
      } finally {
        if (active) setLoadingUser(false);
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, []);

  const hasProfileChanges = useMemo(() => {
    if (!user) return false;
    return (
      form.userName !== user.user_name ||
      form.firstName !== user.first_name ||
      form.lastName !== user.last_name ||
      form.emailAddress !== user.email_address
    );
  }, [form, user]);

  const isTotpEnabled = Boolean(user?.two_factor_enabled);

  function setField<K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function focusDisableInput(index: number) {
    const input = disableInputRefs.current[index];
    if (input) input.focus();
  }

  function applyDisableDigits(startIndex: number, rawValue: string) {
    const digits = rawValue.replace(/\D/g, "");
    if (!digits) {
      setDisableCode((prev) => {
        const next = Array.from({ length: 6 }, (_, index) => prev[index] ?? "");
        next[startIndex] = "";
        return next.join("");
      });
      return;
    }

    setDisableCode((prev) => {
      const next = Array.from({ length: 6 }, (_, index) => prev[index] ?? "");
      for (let offset = 0; offset < digits.length && startIndex + offset < 6; offset += 1) {
        next[startIndex + offset] = digits[offset];
      }
      return next.join("");
    });

    const nextIndex = Math.min(startIndex + digits.length, 5);
    focusDisableInput(nextIndex);
  }

  function onDisableKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !disableCode[index] && index > 0) {
      focusDisableInput(index - 1);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusDisableInput(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      focusDisableInput(index + 1);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!hasProfileChanges) {
      setProfileSuccess("No profile changes to save.");
      return;
    }

    try {
      setProfileBusy(true);
      const updated = await AuthController.updateCurrentUser({
        user_name: form.userName,
        first_name: form.firstName,
        last_name: form.lastName,
        email_address: form.emailAddress,
      });
      setUser(updated);
      setForm(toProfileForm(updated));
      setProfileSuccess("Profile updated.");
    } catch (error) {
      const apiError = error as ApiError;
      setProfileError(apiError?.message || "Failed to update profile.");
    } finally {
      setProfileBusy(false);
    }
  }

  async function startTotpSetup() {
    try {
      setTotpBusy(true);
      setTotpError(null);
      setTotpSuccess(null);
      setBackupCodes([]);
      const response = await AuthController.totpEnroll();
      const qr = typeof response.qr === "string" ? response.qr : null;
      if (!qr) {
        throw { message: "No QR code returned." } as ApiError;
      }
      setQrData(qr);
      setTotpSuccess("Scan the QR code and enter a 6-digit confirmation code.");
    } catch (error) {
      const apiError = error as ApiError;
      setTotpError(apiError?.message || "Failed to start TOTP setup.");
    } finally {
      setTotpBusy(false);
    }
  }

  async function confirmTotp() {
    const code = confirmCode.trim();
    if (!code) {
      setTotpError("Enter the 6-digit authenticator code.");
      return;
    }

    try {
      setTotpBusy(true);
      setTotpError(null);
      const response = await AuthController.totpConfirm(code);
      const codes = Array.isArray(response.backup_codes)
        ? response.backup_codes.filter((value): value is string => typeof value === "string")
        : [];

      setBackupCodes(codes);
      setUser((prev) => (prev ? { ...prev, two_factor_enabled: true } : prev));
      setQrData(null);
      setConfirmCode("");
      setTotpSuccess("TOTP enabled.");
    } catch (error) {
      const apiError = error as ApiError;
      setTotpError(apiError?.message || "Failed to enable TOTP.");
    } finally {
      setTotpBusy(false);
    }
  }

  async function disableTotp() {
    const code = disableCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setTotpError("Enter your current 6-digit TOTP code to disable.");
      return;
    }

    try {
      setTotpBusy(true);
      setTotpError(null);
      await AuthController.totpDisable({ totpToken: code });
      setUser((prev) => (prev ? { ...prev, two_factor_enabled: false } : prev));
      setDisableCode("");
      setQrData(null);
      setConfirmCode("");
      setBackupCodes([]);
      setTotpSuccess("TOTP disabled.");
    } catch (error) {
      const apiError = error as ApiError;
      setTotpError(apiError?.message || "Failed to disable TOTP.");
    } finally {
      setTotpBusy(false);
    }
  }

  async function deleteAccount() {
    if (deleteConfirm.trim() !== "DELETE") {
      setDeleteError("Type DELETE to confirm account deletion.");
      return;
    }

    try {
      setDeleteBusy(true);
      setDeleteError(null);
      await AuthController.deleteCurrentUser();
      onDeleted();
    } catch (error) {
      const apiError = error as ApiError;
      setDeleteError(apiError?.message || "Failed to delete account.");
      setDeleteBusy(false);
    }
  }

  if (loadingUser) {
    return (
      <section className="auth-shell">
        <div className="auth-card glass settings-card">
          <h2>Settings</h2>
          <p className="auth-muted">Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-shell">
      <div className="auth-card glass settings-card">
        <h2>Settings</h2>
        <p className="auth-muted">Manage profile, security, and account actions.</p>

        <form className="auth-form" onSubmit={saveProfile}>
          <label>
            Username
            <input value={form.userName} onChange={(event) => setField("userName", event.target.value)} required />
          </label>
          <label>
            First name
            <input value={form.firstName} onChange={(event) => setField("firstName", event.target.value)} required />
          </label>
          <label>
            Last name
            <input value={form.lastName} onChange={(event) => setField("lastName", event.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={form.emailAddress} onChange={(event) => setField("emailAddress", event.target.value)} required />
          </label>

          {profileError ? <div className="auth-error">{profileError}</div> : null}
          {profileSuccess ? <div className="auth-success">{profileSuccess}</div> : null}

          <button type="submit" disabled={profileBusy || !hasProfileChanges}>
            {profileBusy ? "Saving..." : "Save profile"}
          </button>
        </form>

        <section className="settings-section">
          <div className="settings-row">
            <div>
              <p className="settings-title">TOTP login</p>
              <p className="settings-help">Enable two-factor authentication with an authenticator app.</p>
            </div>
            {!isTotpEnabled ? (
              <button type="button" className="settings-toggle-btn" onClick={startTotpSetup} disabled={totpBusy}>
                Enable
              </button>
            ) : null}
          </div>

          {qrData ? (
            <div className="totp-setup">
              <img src={qrData} alt="TOTP QR code" className="totp-qr" />
              <label>
                Confirm code
                <input
                  value={confirmCode}
                  onChange={(event) => setConfirmCode(event.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                />
              </label>
              <button type="button" onClick={confirmTotp} disabled={totpBusy}>
                {totpBusy ? "Confirming..." : "Confirm TOTP"}
              </button>
            </div>
          ) : null}

          {isTotpEnabled ? (
            <label>
              Disable code
              <div className="otp-input-group" role="group" aria-label="Disable TOTP code">
                {Array.from({ length: 6 }, (_, index) => (
                  <input
                    key={`totp-disable-digit-${index}`}
                    ref={(element) => {
                      disableInputRefs.current[index] = element;
                    }}
                    className="otp-digit-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={disableCode[index] ?? ""}
                    onChange={(event) => applyDisableDigits(index, event.target.value)}
                    onKeyDown={(event) => onDisableKeyDown(index, event)}
                    onPaste={(event) => {
                      event.preventDefault();
                      applyDisableDigits(index, event.clipboardData.getData("text"));
                    }}
                    aria-label={`Disable code digit ${index + 1}`}
                    required
                  />
                ))}
              </div>
              <button type="button" className="settings-toggle-btn settings-disable-btn" onClick={disableTotp} disabled={totpBusy || disableCode.trim().length !== 6}>
                {totpBusy ? "Disabling..." : "Disable"}
              </button>
            </label>
          ) : null}

          {backupCodes.length > 0 ? (
            <div className="auth-success">Backup codes: {backupCodes.join(", ")}</div>
          ) : null}

          {totpError ? <div className="auth-error">{totpError}</div> : null}
          {totpSuccess ? <div className="auth-success">{totpSuccess}</div> : null}
        </section>

        <section className="settings-section danger-zone">
          <p className="settings-title">Delete account</p>
          <p className="settings-help">This permanently removes your account and active tokens.</p>
          <label>
            Type DELETE to confirm
            <input
              className="settings-input"
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
              placeholder="DELETE"
            />
          </label>
          {deleteError ? <div className="auth-error">{deleteError}</div> : null}
          <button
            type="button"
            className={`danger-btn${canDeleteAccount && !deleteBusy ? " danger-btn-ready" : ""}`}
            onClick={deleteAccount}
            disabled={deleteBusy || !canDeleteAccount}
          >
            {deleteBusy ? "Deleting..." : "Delete account"}
          </button>
        </section>
      </div>
    </section>
  );
}
