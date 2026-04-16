import { jest } from '@jest/globals';

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

// ---------------- ESM mocks for models ----------------------------
const UserModel = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
};
const TokenModel = {
  insertUserToken: jest.fn(),
};

// Mock before importing SUT
jest.unstable_mockModule('../src/models/userModel.js', () => ({
  default: UserModel, // userModel.js exports default UserModel
}));
jest.unstable_mockModule('../src/models/tokenModel.js', () => ({
  TokenModel, // userController imports { TokenModel }
}));

// Import SUT after mocks
const { default: UserController } = await import('../src/controllers/userController.js');

// ---------------- Helpers -----------------------------------------
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------- Tests: getAll -----------------------------------
describe('UserController.getAll', () => {
  test('returns all users (200)', async () => {
    const users = [{ id: 1 }, { id: 2 }];
    UserModel.findAll.mockResolvedValue(users);

    const req = {};
    const res = mockRes();

    await UserController.getAll(req, res);

    expect(UserModel.findAll).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled(); // default 200
    expect(res.json).toHaveBeenCalledWith(users);
  });

  test('handles errors (500)', async () => {
    UserModel.findAll.mockRejectedValue(new Error('db fail'));

    const req = {};
    const res = mockRes();

    await UserController.getAll(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'db fail' });
  });
});

// ---------------- Tests: getBySelector -----------------------------
describe('UserController.getBySelector', () => {
  const fullRow = {
    id: 10,
    user_name: 'alice',
    first_name: 'Alice',
    last_name: 'Smith',
    email_address: 'alice@example.com',
    role: 'user',
    status: 'active',
    email_verified: 1,          // controller converts to boolean
    two_factor_enabled: 0,      // controller converts to boolean
    password_hash: '***omit***',
    two_factor_secret: '***omit***',
  };

  test("selector='id' returns shaped user (200)", async () => {
    UserModel.findById.mockResolvedValue(fullRow);

    const req = { params: { selector: 'id', value: '10' } };
    const res = mockRes();

    await UserController.getBySelector(req, res);

    expect(UserModel.findById).toHaveBeenCalledWith(10);
    expect(res.json).toHaveBeenCalledWith({
      id: 10,
      user_name: 'alice',
      first_name: 'Alice',
      last_name: 'Smith',
      email_address: 'alice@example.com',
      role: 'user',
      status: 'active',
      email_verified: true,
      two_factor_enabled: false,
    });
  });

  test("selector='id' with invalid id returns 400", async () => {
    const req = { params: { selector: 'id', value: 'abc' } };
    const res = mockRes();

    await UserController.getBySelector(req, res);

    expect(UserModel.findById).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user id' });
  });

  test("selector='id' with non-existent id returns not found 404", async () => {
    UserModel.findById.mockResolvedValue(null);

    const req = { params: { selector: 'id', value: '99' } };
    const res = mockRes();

    await UserController.getBySelector(req, res);

    expect(UserModel.findById).toHaveBeenCalledWith(99);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  test("selector='email' with invalid email returns 400", async () => {
    const req = { params: { selector: 'email', value: 'not-an-email' } };
    const res = mockRes();

    await UserController.getBySelector(req, res);

    expect(UserModel.findByEmail).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email' });
  });

  test("selector='email' returns returns shaped user (200)", async () => {
    UserModel.findByEmail.mockResolvedValue(fullRow);

    const req = { params: { selector: 'email', value: 'ALICE@EXAMPLE.COM' } }; // controller lowercases
    const res = mockRes();

    await UserController.getBySelector(req, res);

    expect(UserModel.findByEmail).toHaveBeenCalledWith('alice@example.com');
    expect(res.json).toHaveBeenCalledWith({
      id: 10,
      user_name: 'alice',
      first_name: 'Alice',
      last_name: 'Smith',
      email_address: 'alice@example.com',
      role: 'user',
      status: 'active',
      email_verified: true,
      two_factor_enabled: false,
    });
  });

  test('unsupported selector returns 400', async () => {
    const req = { params: { selector: 'name', value: 'alice' } };
    const res = mockRes();

    await UserController.getBySelector(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Unsupported selector: name" });
  });

  test('handles model errors returns 500', async () => {
    UserModel.findById.mockRejectedValue(new Error('boom'));

    const req = { params: { selector: 'id', value: '1' } };
    const res = mockRes();

    await UserController.getBySelector(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'boom' });
  });
});

// ---------------- Tests: create -----------------------------------
describe('UserController.create', () => {
  test('creates user (201)', async () => {
    const newUser = { id: 1, user_name: 'bob' };
    UserModel.create.mockResolvedValue(newUser);

    const req = {
      validated: {
        user_name: 'bob',
        first_name: 'Bob',
        last_name: 'Brown',
        email_address: 'bob@example.com',
        password_hash: 'x'.repeat(60),
        password_changed_at: new Date().toISOString(),
        preferences: { theme: 'dark' },
      },
    };
    const res = mockRes();

    await UserController.create(req, res);

    expect(UserModel.create).toHaveBeenCalledWith(req.validated);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(newUser);
  });

  test('returns 500 on errors', async () => {
    UserModel.create.mockRejectedValue(new Error('fail'));

    const req = { validated: { user_name: 'x' } };
    const res = mockRes();

    await UserController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
  });
});

// ---------------- Tests: remove -----------------------------------
describe('UserController.remove', () => {
  test('removes user (204)', async () => {
    UserModel.findById.mockResolvedValue({ id: 2 });
    UserModel.remove.mockResolvedValue({ message: 'User deleted' });

    const req = { params: { id: '2' } };
    const res = mockRes();

    await UserController.remove(req, res);

    expect(UserModel.findById).toHaveBeenCalledWith('2');
    expect(UserModel.remove).toHaveBeenCalledWith('2');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  test('returns 404 when user does not exist', async () => {
    UserModel.findById.mockResolvedValue(undefined);

    const req = { params: { id: '2' } };
    const res = mockRes();

    await UserController.remove(req, res);

    expect(UserModel.findById).toHaveBeenCalledWith('2');
    expect(UserModel.remove).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  test('returns 500 on errors', async () => {
    UserModel.findById.mockRejectedValue(new Error('oops'));
    UserModel.remove.mockRejectedValue(new Error('oops'));

    const req = { params: { id: '2' } };
    const res = mockRes();

    await UserController.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'oops' });
  });
});