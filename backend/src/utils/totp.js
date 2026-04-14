import { generateSecret, generateURI, verify } from 'otplib';
import crypto from 'crypto';

/**
 * Generate a secret for a user, which they will store in their authenticator app.
 */
export function generateTotpSecret() {
  return generateSecret(); // base32
}

/**
 * Build an otpauth: URL that authenticator apps understand (Google Authenticator, etc.)
 * issuer: your app/brand name
 * label: usually email or username (displayed in the app)
 */
export function buildOtpAuthUrl({ secret, label, issuer }) {
  return generateURI({
    type: 'totp',
    label,
    issuer,
    secret,
  });
}

/**
 * Verify a 6-digit token against the stored secret.
 */
export function verifyTotp({ token, secret }) {
  const code = String(token ?? '').trim();
  if (!/^\d{6}$/.test(code) || !secret) return Promise.resolve(false);

  // otplib can return either a boolean or an object like { valid: boolean }.
  return Promise.resolve(verify({ token: code, secret }))
    .then((result) => {
      if (typeof result === 'boolean') return result;
      if (result && typeof result === 'object' && 'valid' in result) {
        return Boolean(result.valid);
      }
      return false;
    })
    .catch(() => false);
}


export function generateBackupCodes(count = 10) {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString('hex') // e.g., "3fa92b1c"
  );
}