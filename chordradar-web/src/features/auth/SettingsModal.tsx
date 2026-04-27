import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
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

  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

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
    if (!code) {
      setTotpError("Enter your current TOTP code or a backup code to disable.");
      return;
    }

    try {
      setTotpBusy(true);
      setTotpError(null);
      if (/^\d{6}$/.test(code)) {
        await AuthController.totpDisable({ totpToken: code });
      } else {
        await AuthController.totpDisable({ backupCode: code });
      }
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
            <button type="button" className="settings-toggle-btn" onClick={isTotpEnabled ? disableTotp : startTotpSetup} disabled={totpBusy}>
              {isTotpEnabled ? "Disable" : "Enable"}
            </button>
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
              <input
                value={disableCode}
                onChange={(event) => setDisableCode(event.target.value)}
                placeholder="6-digit TOTP or backup code"
              />
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
            <input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder="DELETE" />
          </label>
          {deleteError ? <div className="auth-error">{deleteError}</div> : null}
          <button type="button" className="danger-btn" onClick={deleteAccount} disabled={deleteBusy}>
            {deleteBusy ? "Deleting..." : "Delete account"}
          </button>
        </section>
      </div>
    </section>
  );
}
