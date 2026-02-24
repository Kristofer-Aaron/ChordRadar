
import QRCode from 'qrcode';

/**
 * Returns a data URL (PNG image) of the QR code for the otpauth URL.
 */
export async function generateQrDataUrl(otpauthUrl) {
  return QRCode.toDataURL(otpauthUrl, { errorCorrectionLevel: 'M' });
}
