// tests/authController.test.js
import { jest } from '@jest/globals';

// Silence console like your other tests
const noop = () => {};
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(noop);
  jest.spyOn(console, 'warn').mockImplementation(noop);
  jest.spyOn(console, 'log').mockImplementation(noop);
});
afterAll(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
  console.log.mockRestore();
});

// ------------------ ESM mocks ------------------
const UserModel = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateTwoFactorSecret: jest.fn(),
  enableTwoFactor: jest.fn(),
  setBackupCodes: jest.fn(),
  disableTwoFactor: jest.fn(),
};

const TokenModel = {
  findUserToken: jest.fn(),
  deleteUserToken: jest.fn(),
  insertUserToken: jest.fn(),
  findTokenString: jest.fn(),
  consumeTokenString: jest.fn(),
};

const sendEmail = jest.fn();

const totp = {
  generateTotpSecret: jest.fn(),
  buildOtpAuthUrl: jest.fn(),
  verifyTotp: jest.fn(),
  generateBackupCodes: jest.fn(),
};

const QRCode = {
  toBuffer: jest.fn(),
};

const qrcodeUtils = {
  generateQrDataUrl: jest.fn(),
};

const pool = {
  query: jest.fn(),
};

const jwt = {
  sign: jest.fn(),
};

const bcrypt = {
  compare: jest.fn(),
  hash: jest.fn(),
};

const cryptoMock = {
  randomBytes: jest.fn(),
};

// Register mocks BEFORE importing SUT
jest.unstable_mockModule('../src/models/userModel.js', () => ({ default: UserModel }));
jest.unstable_mockModule('../src/models/tokenModel.js', () => ({ TokenModel }));
jest.unstable_mockModule('../src/utils/sendEmail.js', () => ({ default: sendEmail }));
jest.unstable_mockModule('../src/utils/totp.js', () => ({
  generateTotpSecret: totp.generateTotpSecret,
  buildOtpAuthUrl: totp.buildOtpAuthUrl,
  verifyTotp: totp.verifyTotp,
  generateBackupCodes: totp.generateBackupCodes,
}));
jest.unstable_mockModule('qrcode', () => ({ default: QRCode }));
jest.unstable_mockModule('../src/utils/qrcode.js', () => ({
  generateQrDataUrl: qrcodeUtils.generateQrDataUrl,
}));

jest.unstable_mockModule('../src/config/db.js', () => ({ default: pool }));

// ✅ default imports in controller → default mocks here
jest.unstable_mockModule('jsonwebtoken', () => ({ default: jwt }));
jest.unstable_mockModule('bcrypt', () => ({ default: bcrypt }));
jest.unstable_mockModule('crypto', () => ({ default: cryptoMock }));


// Import SUT after mocks
const { AuthController } = await import('../src/controllers/authController.js');

// ------------------ Helpers ------------------
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  res.send   = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();

  // default env
  process.env.JWT_SECRET = 'jwt-secret';
  process.env.API_TOKEN_EXPIRATION = '3600';
  process.env.API_TOKEN_EXPIRATION_LONG = '2592000';
  process.env.EMAIL_TOKEN_EXPIRATION = '86400';
  process.env.HOST = 'localhost';
  process.env.PORT = '3000';
  process.env.APP_NAME = 'MyApp';

  cryptoMock.randomBytes.mockReturnValue(Buffer.alloc(32, 0xab)); // 64-hex
  jwt.sign.mockReturnValue('jwt.token');
  bcrypt.hash.mockResolvedValue('hashed');
  bcrypt.compare.mockResolvedValue(true);
});

// ------------------ login ------------------
describe('AuthController.login', () => {
  test('logs in successfully (200) and flags renewed when token existed', async () => {
    const user = { id: 1, role: 'user', password_hash: 'pw' };
    UserModel.findByEmail.mockResolvedValue(user);
    TokenModel.findUserToken.mockResolvedValue({ id: 9 }); // renewal

    const req = { body: { email_address: 'a@b.com', password: 'secret' }, query: { 'remember-me': 'true' } };
    const res = mockRes();

    await AuthController.login(req, res);

    expect(UserModel.findByEmail).toHaveBeenCalledWith('a@b.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('secret', 'pw');
    expect(TokenModel.deleteUserToken).toHaveBeenCalledWith(1, 'api_access');
    expect(TokenModel.insertUserToken).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, token: 'jwt.token', renewed: true });
  });

  test('400 on missing credentials', async () => {
    const res = mockRes();
    await AuthController.login({ body: {}, query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('401 on invalid user or password', async () => {
    const res = mockRes();

    // user not found
    UserModel.findByEmail.mockResolvedValue(null);
    await AuthController.login({ body: { email_address: 'x@y', password: 'p' }, query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(401);

    // bad password
    jest.clearAllMocks();
    UserModel.findByEmail.mockResolvedValue({ id: 2, password_hash: 'h' });
    bcrypt.compare.mockResolvedValue(false);
    await AuthController.login({ body: { email_address: 'x@y', password: 'p' }, query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('500 when JWT_SECRET missing', async () => {
    delete process.env.JWT_SECRET;
    UserModel.findByEmail.mockResolvedValue({ id: 1, password_hash: 'h' });
    const res = mockRes();

    await AuthController.login({ body: { email_address: 'a@b', password: 'p' }, query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server config error' });
  });
});

// ------------------ loginTotp ------------------
describe('AuthController.loginTotp', () => {
  test('logs in with TOTP (200)', async () => {
    UserModel.findByEmail.mockResolvedValue({ id: 3, role: 'user', two_factor_enabled: 1, two_factor_secret: 'BASE32' });
    totp.verifyTotp.mockReturnValue(true);
    TokenModel.findUserToken.mockResolvedValue(null);

    const req = { body: { email_address: 'user@ex.com', totp_token: '123456' }, query: { 'remember-me': 'false' } };
    const res = mockRes();

    await AuthController.loginTotp(req, res);

    expect(totp.verifyTotp).toHaveBeenCalledWith({ token: '123456', secret: 'BASE32' });
    expect(TokenModel.insertUserToken).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, token: 'jwt.token', renewed: false });
  });

  test('guards and errors: 400/401/500', async () => {
    const res = mockRes();

    // 400 missing
    await AuthController.loginTotp({ body: {}, query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // 401 user not found
    jest.clearAllMocks();
    UserModel.findByEmail.mockResolvedValue(null);
    await AuthController.loginTotp({ body: { email_address: 'a@b', totp_token: '111111' }, query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(401);

    // 401 2FA disabled
    jest.clearAllMocks();
    UserModel.findByEmail.mockResolvedValue({ two_factor_enabled: 0 });
    await AuthController.loginTotp({ body: { email_address: 'a@b', totp_token: '111111' }, query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(401);

    // 401 invalid TOTP
    jest.clearAllMocks();
    UserModel.findByEmail.mockResolvedValue({ id: 1, two_factor_enabled: 1, two_factor_secret: 'S' });
    totp.verifyTotp.mockReturnValue(false);
    await AuthController.loginTotp({ body: { email_address: 'a@b', totp_token: '000000' }, query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(401);

    // 500 no secret
    delete process.env.JWT_SECRET;
    jest.clearAllMocks();
    UserModel.findByEmail.mockResolvedValue({ id: 1, two_factor_enabled: 1, two_factor_secret: 'S' });
    totp.verifyTotp.mockReturnValue(true);
    await AuthController.loginTotp({ body: { email_address: 'a@b', totp_token: '123456' }, query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ------------------ logout ------------------
describe('AuthController.logout', () => {
  test('deletes token on logout (200)', async () => {
    TokenModel.findTokenString.mockResolvedValue({ id: 1 });
    const req = { headers: { authorization: 'Bearer abc' }, user: { id: 42 } };
    const res = mockRes();

    await AuthController.logout(req, res);

    expect(TokenModel.findTokenString).toHaveBeenCalledWith('abc', 'api_access');
    expect(TokenModel.deleteUserToken).toHaveBeenCalledWith(42, 'api_access');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Logout successful' });
  });

  test('404 when session not found; 500 on error', async () => {
    const res = mockRes();
    TokenModel.findTokenString.mockResolvedValue(null);
    await AuthController.logout({ headers: { authorization: 'Bearer expired' }, user: { id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    jest.clearAllMocks();
    TokenModel.findTokenString.mockRejectedValue(new Error('boom'));
    await AuthController.logout({ headers: { authorization: 'Bearer tok' }, user: { id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ------------------ register ------------------
describe('AuthController.register', () => {
  test('registers and sends verification email (201)', async () => {
    UserModel.create.mockResolvedValue({ id: 100 });
    TokenModel.insertUserToken.mockResolvedValue({ id: 1 });

    const req = {
      body: {
        user_name: 'u',
        first_name: 'f',
        last_name: 'l',
        email_address: 'u@ex.com',
        password: 'secret123',
        preferences: { theme: 'dark' },
      },
    };
    const res = mockRes();

    await AuthController.register(req, res);

    expect(bcrypt.hash).toHaveBeenCalled();
    expect(UserModel.create).toHaveBeenCalled();
    expect(TokenModel.insertUserToken).toHaveBeenCalledWith(
      100,
      expect.any(String),
      'email_verification',
      expect.any(Date),
      expect.any(Date),
    );
    expect(sendEmail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('500 on create failure', async () => {
    UserModel.create.mockRejectedValue(new Error('db error'));
    const res = mockRes();

    await AuthController.register({
      body: {
        user_name: 'u', first_name: 'f', last_name: 'l',
        email_address: 'u@ex.com', password: 'x', preferences: {}
      }
    }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'db error' });
  });
});

// ------------------ verify ------------------
describe('AuthController.verify', () => {
  test('activates user, consumes token, issues api token (200)', async () => {
    const future = new Date(Date.now() + 60_000);
    TokenModel.findTokenString.mockResolvedValue({ user_id: 55, expires_at: future });
    pool.query.mockResolvedValue([{ affectedRows: 1 }]);
    TokenModel.consumeTokenString.mockResolvedValue(true);
    TokenModel.insertUserToken.mockResolvedValue({ id: 1 });

    const req = { validatedQuery: { token: 't'.repeat(64) } };
    const res = mockRes();

    await AuthController.verify(req, res);

    expect(TokenModel.findTokenString).toHaveBeenCalledWith('t'.repeat(64), 'email_verification');
    expect(pool.query).toHaveBeenCalled();
    expect(TokenModel.consumeTokenString).toHaveBeenCalled();
    expect(TokenModel.insertUserToken).toHaveBeenCalledWith(
      55, 'jwt.token', 'api_access', expect.any(Date), expect.any(Date)
    );
    expect(res.json).toHaveBeenCalledWith({ message: 'Email verified successfully', token: 'jwt.token' });
  });

  test('400 on invalid/expired token; 500 on error', async () => {
    const res = mockRes();

    // not found
    TokenModel.findTokenString.mockResolvedValue(null);
    await AuthController.verify({ validatedQuery: { token: 'x' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // expired
    jest.clearAllMocks();
    TokenModel.findTokenString.mockResolvedValue({ user_id: 1, expires_at: new Date(Date.now() - 1000) });
    await AuthController.verify({ validatedQuery: { token: 'x' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // 500
    jest.clearAllMocks();
    TokenModel.findTokenString.mockRejectedValue(new Error('boom'));
    await AuthController.verify({ validatedQuery: { token: 'x' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ------------------ totpEnroll ------------------
describe('AuthController.totpEnroll', () => {
  test('stores secret and returns QR data (200)', async () => {
    UserModel.findById.mockResolvedValue({ id: 7, email_address: 'u@ex.com', user_name: 'u' });
    totp.generateTotpSecret.mockReturnValue('BASE32SECRET');
    totp.buildOtpAuthUrl.mockReturnValue('otpauth://...secret=BASE32SECRET');
    qrcodeUtils.generateQrDataUrl.mockResolvedValue('data:image/png;base64,AAA');
    UserModel.updateTwoFactorSecret.mockResolvedValue(true);

    const req = { user: { id: 7 } };
    const res = mockRes();

    await AuthController.totpEnroll(req, res);

    expect(UserModel.updateTwoFactorSecret).toHaveBeenCalledWith('7', 'BASE32SECRET');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, qr: 'data:image/png;base64,AAA' }));
  });

  test('404 when user missing; 500 when secret update fails', async () => {
    const res = mockRes();

    UserModel.findById.mockResolvedValue(null);
    await AuthController.totpEnroll({ user: { id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    jest.clearAllMocks();
    UserModel.findById.mockResolvedValue({ id: 1 });
    UserModel.updateTwoFactorSecret.mockResolvedValue(false);
    await AuthController.totpEnroll({ user: { id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ------------------ getQrPng ------------------
describe('AuthController.getQrPng', () => {
  test('renders PNG (200)', async () => {
    UserModel.findById.mockResolvedValue({ id: 9, two_factor_secret: 'S', email_address: 'u@e', user_name: 'u' });
    totp.buildOtpAuthUrl.mockReturnValue('otpauth://...');
    QRCode.toBuffer.mockResolvedValue(Buffer.from('PNG_DATA'));

    const req = { user: { id: 9 } };
    const res = mockRes();

    await AuthController.getQrPng(req, res);

    expect(QRCode.toBuffer).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(Buffer.from('PNG_DATA'));
  });

  test('404 when user/secret missing; 500 on error', async () => {
    const res = mockRes();

    UserModel.findById.mockResolvedValue(null);
    await AuthController.getQrPng({ user: { id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    jest.clearAllMocks();
    UserModel.findById.mockResolvedValue({ id: 1, two_factor_secret: null });
    await AuthController.getQrPng({ user: { id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    jest.clearAllMocks();
    UserModel.findById.mockRejectedValue(new Error('oops'));
    await AuthController.getQrPng({ user: { id: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ------------------ totpConfirm ------------------
describe('AuthController.totpConfirm', () => {
  test('enables 2FA and saves backup codes (200)', async () => {
    UserModel.findById.mockResolvedValue({ id: 2, two_factor_secret: 'S' });
    totp.verifyTotp.mockReturnValue(true);
    UserModel.enableTwoFactor.mockResolvedValue(true);
    totp.generateBackupCodes.mockReturnValue(['A', 'B', 'C']);
    bcrypt.hash.mockResolvedValue('H');
    UserModel.setBackupCodes.mockResolvedValue(true);

    const req = { user: { id: 2 }, body: { token: '123456' } };
    const res = mockRes();

    await AuthController.totpConfirm(req, res);

    expect(UserModel.enableTwoFactor).toHaveBeenCalledWith('2');
    expect(UserModel.setBackupCodes).toHaveBeenCalledWith('2', JSON.stringify(['H','H','H']));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, backup_codes: ['A','B','C'] }));
  });

  test('guards: 404/400/422 and failures 500', async () => {
    const res = mockRes();

    // 404
    UserModel.findById.mockResolvedValue(null);
    await AuthController.totpConfirm({ user: { id: 1 }, body: { token: '111111' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    // 400 no secret
    jest.clearAllMocks();
    UserModel.findById.mockResolvedValue({ id: 1, two_factor_secret: null });
    await AuthController.totpConfirm({ user: { id: 1 }, body: { token: '111111' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // 400 missing code
    jest.clearAllMocks();
    UserModel.findById.mockResolvedValue({ id: 1, two_factor_secret: 'S' });
    await AuthController.totpConfirm({ user: { id: 1 }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // 422 invalid TOTP
    jest.clearAllMocks();
    UserModel.findById.mockResolvedValue({ id: 1, two_factor_secret: 'S' });
    totp.verifyTotp.mockReturnValue(false);
    await AuthController.totpConfirm({ user: { id: 1 }, body: { code: '000000' } }, res);
    expect(res.status).toHaveBeenCalledWith(422);

    // 500 enable fails
    jest.clearAllMocks();
    UserModel.findById.mockResolvedValue({ id: 1, two_factor_secret: 'S' });
    totp.verifyTotp.mockReturnValue(true);
    UserModel.enableTwoFactor.mockResolvedValue(false);
    await AuthController.totpConfirm({ user: { id: 1 }, body: { token: '123456' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);

    // 500 store backups fails
    jest.clearAllMocks();
    UserModel.findById.mockResolvedValue({ id: 1, two_factor_secret: 'S' });
    totp.verifyTotp.mockReturnValue(true);
    UserModel.enableTwoFactor.mockResolvedValue(true);
    totp.generateBackupCodes.mockReturnValue(['X']);
    bcrypt.hash.mockResolvedValue('HX');
    UserModel.setBackupCodes.mockResolvedValue(false);
    await AuthController.totpConfirm({ user: { id: 1 }, body: { token: '123456' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ------------------ totpDisable ------------------
describe('AuthController.totpDisable', () => {
  test('idempotent success when already disabled (200)', async () => {
    UserModel.findById.mockResolvedValue({ id: 5, two_factor_enabled: 0, two_factor_secret: null });
    const res = mockRes();
    await AuthController.totpDisable({ user: { id: 5 }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('disables via password (200)', async () => {
    UserModel.findById.mockResolvedValue({ id: 5, two_factor_enabled: 1, two_factor_secret: 'S', password_hash: 'H' });
    bcrypt.compare.mockResolvedValue(true);
    UserModel.disableTwoFactor.mockResolvedValue(true);

    const req = { user: { id: 5 }, body: { password: 'secret' } };
    const res = mockRes();

    await AuthController.totpDisable(req, res);

    expect(bcrypt.compare).toHaveBeenCalledWith('secret', 'H');
    expect(UserModel.disableTwoFactor).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('disables via TOTP (200)', async () => {
    UserModel.findById.mockResolvedValue({ id: 6, two_factor_enabled: 1, two_factor_secret: 'S' });
    totp.verifyTotp.mockReturnValue(true);
    UserModel.disableTwoFactor.mockResolvedValue(true);

    const req = { user: { id: 6 }, body: { totp_token: '123456' } };
    const res = mockRes();

    await AuthController.totpDisable(req, res);

    expect(totp.verifyTotp).toHaveBeenCalledWith({ token: '123456', secret: 'S' });
    expect(UserModel.disableTwoFactor).toHaveBeenCalledWith(6);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('disables via backup code (200)', async () => {
    const hashed = await bcrypt.hash('BACKUP', 10);
    UserModel.findById.mockResolvedValue({
      id: 7,
      two_factor_enabled: 1,
      two_factor_secret: 'S',
      two_factor_backup: JSON.stringify([hashed]),
    });
    bcrypt.compare.mockResolvedValueOnce(true);
    UserModel.setBackupCodes.mockResolvedValue(true);
    UserModel.disableTwoFactor.mockResolvedValue(true);

    const req = { user: { id: 7 }, body: { backup_code: 'BACKUP' } };
    const res = mockRes();

    await AuthController.totpDisable(req, res);

    expect(UserModel.setBackupCodes).toHaveBeenCalledWith(7, JSON.stringify(null));
    expect(UserModel.disableTwoFactor).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('guards: 404 user not found; 400 none provided; 401 invalid creds', async () => {
    const res = mockRes();

    // 404
    UserModel.findById.mockResolvedValue(null);
    await AuthController.totpDisable({ user: { id: 1 }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    // 400 none
    jest.clearAllMocks();
    UserModel.findById.mockResolvedValue({ id: 1, two_factor_enabled: 1, two_factor_secret: 'S' });
    await AuthController.totpDisable({ user: { id: 1 }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // 401 wrong password
    jest.clearAllMocks();
    UserModel.findById.mockResolvedValue({ id: 1, two_factor_enabled: 1, two_factor_secret: 'S', password_hash: 'H' });
    bcrypt.compare.mockResolvedValue(false);
    await AuthController.totpDisable({ user: { id: 1 }, body: { password: 'wrong' } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});