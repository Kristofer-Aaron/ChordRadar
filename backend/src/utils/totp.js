import { authenticator } from 'otplib';
import crypto from 'crypto';

/**
 * Generate a secret for a user, which they will store in their authenticator app.
 */
export function generateTotpSecret() {
  return authenticator.generateSecret(); // base32
}

/**
 * Build an otpauth: URL that authenticator apps understand (Google Authenticator, etc.)
 * issuer: your app/brand name
 * label: usually email or username (displayed in the app)
 */
export function buildOtpAuthUrl({ secret, label, issuer }) {
  return authenticator.keyuri(label, issuer, secret);
}

/**
 * Verify a 6-digit token against the stored secret.
 */
export function verifyTotp({ token, secret }) {
  return authenticator.verify({ token, secret });
}


export function generateBackupCodes(count = 10) {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString('hex') // e.g., "3fa92b1c"
  );
}
