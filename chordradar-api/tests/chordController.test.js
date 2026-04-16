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

// ------------------ ESM mocks ------------------
const ChordModel = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findBySelector: jest.fn(),
  findUserChords: jest.fn(),
  create: jest.fn(),
  insertUserChordRelation: jest.fn(),
  remove: jest.fn(),
  removeUserChordRelation: jest.fn(),
  patch: jest.fn(),
};

const UserModel = {
  findByAccessToken: jest.fn(),
};

// Register mocks BEFORE importing the SUT
jest.unstable_mockModule('../src/models/chordModel.js', () => ({ ChordModel }));
jest.unstable_mockModule('../src/models/userModel.js', () => ({ default: UserModel }));

// Import the controller AFTER the mocks are in place
const { ChordController } = await import('../src/controllers/chordController.js');

// ------------------ Response helper ------------------
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

// ------------------ getAll ------------------
describe('ChordController.getAll', () => {
  test('returns all chords (200) with parsed fields', async () => {
    const rows = [{ id: 1 }, { id: 2 }];
    ChordModel.findAll.mockResolvedValue(rows);

    const req = {
      query: {
        fields: JSON.stringify({ notation: 'value', tuning: 'value', grip: 'value' }),
      },
    };
    const res = mockRes();

    await ChordController.getAll(req, res);

    expect(ChordModel.findAll).toHaveBeenCalledWith({
      fields: { notation: 'value', tuning: 'value', grip: 'value' },
    });
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(rows);
  });

  test('falls back to empty fields object on bad JSON (200)', async () => {
    const rows = [];
    ChordModel.findAll.mockResolvedValue(rows);

    const req = { query: { fields: '{bad-json' } };
    const res = mockRes();

    await ChordController.getAll(req, res);

    expect(ChordModel.findAll).toHaveBeenCalledWith({ fields: {} });
    expect(res.json).toHaveBeenCalledWith(rows);
  });

  test('handles errors (500)', async () => {
    ChordModel.findAll.mockRejectedValue(new Error('db fail'));

    const req = { query: {} };
    const res = mockRes();

    await ChordController.getAll(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'db fail' });
  });
});

// ------------------ getById ------------------
describe('ChordController.getById', () => {
  test('returns the chord by id (200) with parsed fields', async () => {
    const row = { id: 5, notation: 'C', tuning: 'standard', grip: '123' };
    ChordModel.findById.mockResolvedValue(row);

    const req = {
      params: { id: '5' },
      query: { fields: JSON.stringify({ notation: 'value' }) },
    };
    const res = mockRes();

    await ChordController.getById(req, res);

    expect(ChordModel.findById).toHaveBeenCalledWith({
      id: 5,
      fields: { notation: 'value' },
    });
    expect(res.json).toHaveBeenCalledWith(row);
  });

  test('returns 404 when not found', async () => {
    ChordModel.findById.mockResolvedValue(null);

    const req = { params: { id: '9' }, query: {} };
    const res = mockRes();

    await ChordController.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Chord not found' });
  });

  test('handles errors (500)', async () => {
    ChordModel.findById.mockRejectedValue(new Error('boom'));

    const req = { params: { id: '1' }, query: {} };
    const res = mockRes();

    await ChordController.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'boom' });
  });
});

// ------------------ getBySelector ------------------
describe('ChordController.getBySelector', () => {
  test('returns a list (possibly empty) for valid selector (200)', async () => {
    const rows = [{ id: 1, notation: 'C', tuning: 'standard', grip: '123' }];
    ChordModel.findBySelector.mockResolvedValue(rows);

    const req = {
      params: { selector: 'notation', selectorValue: 'C', tuningValue: 'standard' },
    };
    const res = mockRes();

    await ChordController.getBySelector(req, res);

    expect(ChordModel.findBySelector).toHaveBeenCalledWith({
      selector: 'notation',
      selectorValue: 'C',
      tuningValue: 'standard',
    });
    expect(res.json).toHaveBeenCalledWith(rows);
  });

  test('returns provided status (400) on model error', async () => {
    const e = Object.assign(new Error('Invalid selector'), { status: 400 });
    ChordModel.findBySelector.mockRejectedValue(e);

    const req = {
      params: { selector: 'invalid', selectorValue: 'x', tuningValue: 'std' },
    };
    const res = mockRes();

    await ChordController.getBySelector(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid selector' });
  });

  test('returns 500 on generic error', async () => {
    ChordModel.findBySelector.mockRejectedValue(new Error('db fail'));

    const req = {
      params: { selector: 'notation', selectorValue: 'C', tuningValue: 'standard' },
    };
    const res = mockRes();

    await ChordController.getBySelector(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'db fail' });
  });
});

// ------------------ getUserChords ------------------
describe('ChordController.getUserChords', () => {
  test('returns chords for current user (200)', async () => {
    const token = 'abc';
    const user = { user_id: 10, role: 'user' };
    const chords = [{ id: 1 }, { id: 2 }];

    UserModel.findByAccessToken.mockResolvedValue(user);
    ChordModel.findUserChords.mockResolvedValue(chords);

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();

    await ChordController.getUserChords(req, res);

    expect(UserModel.findByAccessToken).toHaveBeenCalledWith(token);
    expect(ChordModel.findUserChords).toHaveBeenCalledWith(10);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(chords);
  });

  test('returns 500 on error', async () => {
    const token = 'abc';
    const user = { user_id: 10, role: 'user' };

    UserModel.findByAccessToken.mockResolvedValue(user);
    ChordModel.findUserChords.mockRejectedValue(new Error('fail'));

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();

    await ChordController.getUserChords(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});

// ------------------ create ------------------
describe('ChordController.create', () => {
  test('creates chord (201) and links to user when role=user', async () => {
    const token = 'tok';
    const user = { user_id: 7, role: 'user' };
    const result = { id: 99 };

    UserModel.findByAccessToken.mockResolvedValue(user);
    ChordModel.create.mockResolvedValue(result);
    ChordModel.insertUserChordRelation.mockResolvedValue({ user_id: 7, chord_id: 99, created: true });

    const req = {
      headers: { authorization: `Bearer ${token}` },
      body: { notation: ' Am ', tuning: ' Standard ', grip: ' 123 ' },
    };
    const res = mockRes();

    await ChordController.create(req, res);

    expect(UserModel.findByAccessToken).toHaveBeenCalledWith(token);
    expect(ChordModel.create).toHaveBeenCalledWith({
      notation: 'Am',
      tuning: 'Standard',
      grip: '123',
    });
    expect(ChordModel.insertUserChordRelation).toHaveBeenCalledWith(7, 99);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(result);
  });

  test('creates chord (201) without linking when role=admin', async () => {
    const token = 'tok';
    const admin = { id: 1, role: 'admin' };
    const result = { id: 123 };

    UserModel.findByAccessToken.mockResolvedValue(admin);
    ChordModel.create.mockResolvedValue(result);

    const req = {
      headers: { authorization: `Bearer ${token}` },
      body: { notation: 'C', tuning: 'standard', grip: '000' },
    };
    const res = mockRes();

    await ChordController.create(req, res);

    expect(ChordModel.insertUserChordRelation).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(result);
  });

  test('returns 409 on duplicate (ER_DUP_ENTRY), links existing chord for user', async () => {
    const token = 'tok';
    const user = { user_id: 7, role: 'user' };
    const dupErr = new Error('duplicate');
    dupErr.code = 'ER_DUP_ENTRY';

    UserModel.findByAccessToken.mockResolvedValue(user);
    ChordModel.create.mockRejectedValue(dupErr);

    // The controller looks up by selector "notation" and then matches by grip
    ChordModel.findBySelector.mockResolvedValue([
      { id: 55, notation: 'Am', tuning: 'standard', grip: '123' },
      { id: 56, notation: 'Am', tuning: 'standard', grip: 'x12' },
    ]);

    const req = {
      headers: { authorization: `Bearer ${token}` },
      body: { notation: 'Am', tuning: 'standard', grip: '123' },
    };
    const res = mockRes();

    await ChordController.create(req, res);

    expect(ChordModel.findBySelector).toHaveBeenCalledWith({
      selector: 'notation',
      selectorValue: 'Am',
      tuningValue: 'standard',
    });
    expect(ChordModel.insertUserChordRelation).toHaveBeenCalledWith(7, 55);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Chord with this notation, tuning and grip already exists',
    });
  });

  test('returns 500 on other errors', async () => {
    const token = 'tok';
    const user = { user_id: 7, role: 'user' };

    UserModel.findByAccessToken.mockResolvedValue(user);
    ChordModel.create.mockRejectedValue(new Error('oops'));

    const req = {
      headers: { authorization: `Bearer ${token}` },
      body: { notation: 'Am', tuning: 'standard', grip: '123' },
    };
    const res = mockRes();

    await ChordController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'oops' });
  });
});

// ------------------ remove ------------------
describe('ChordController.remove', () => {
  test('returns 404 if chord not found', async () => {
    ChordModel.findById.mockResolvedValue(null);

    const req = { params: { id: '9' }, headers: {} };
    const res = mockRes();

    await ChordController.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Chord not found' });
  });

  test('admin deletes chord (204)', async () => {
    ChordModel.findById.mockResolvedValue({ id: 11 });
    UserModel.findByAccessToken.mockResolvedValue({ id: 1, role: 'admin' });
    ChordModel.remove.mockResolvedValue({ message: 'Chord deleted' });

    const req = {
      params: { id: '11' },
      headers: { authorization: 'Bearer admintok' },
    };
    const res = mockRes();

    await ChordController.remove(req, res);

    expect(UserModel.findByAccessToken).toHaveBeenCalledWith('admintok');
    expect(ChordModel.remove).toHaveBeenCalledWith(11);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  test('user unlinks their relation (204)', async () => {
    ChordModel.findById.mockResolvedValue({ id: 12 });
    UserModel.findByAccessToken.mockResolvedValue({ user_id: 7, role: 'user' });
    ChordModel.removeUserChordRelation.mockResolvedValue({ user_id: 7, chord_id: 12, removed: true });

    const req = {
      params: { id: '12' },
      headers: { authorization: 'Bearer tok' },
    };
    const res = mockRes();

    await ChordController.remove(req, res);

    expect(ChordModel.removeUserChordRelation).toHaveBeenCalledWith(7, 12);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  test('returns 500 on error', async () => {
    ChordModel.findById.mockResolvedValue({ id: 10 });
    UserModel.findByAccessToken.mockResolvedValue({ id: 1, role: 'admin' });
    ChordModel.remove.mockRejectedValue(new Error('fail'));

    const req = {
      params: { id: '10' },
      headers: { authorization: 'Bearer admintok' },
    };
    const res = mockRes();

    await ChordController.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
  });
});

// ------------------ patch ------------------
describe('ChordController.patch', () => {
  test('returns 404 when chord not found', async () => {
    ChordModel.findById.mockResolvedValue(null);

    const req = { params: { id: '5' }, body: { notation: 'Am' } };
    const res = mockRes();

    await ChordController.patch(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Chord not found' });
  });

  test('returns 409 if target values would duplicate another chord', async () => {
    // current chord
    ChordModel.findById.mockResolvedValue({ id: 5, notation: 'Am', tuning: 'standard', grip: '123' });
    // findBySelector returns a chord with same target grip and a different id
    ChordModel.findBySelector.mockResolvedValue([{ id: 77, notation: 'Am', tuning: 'standard', grip: 'x12' }, { id: 88, notation: 'Am', tuning: 'standard', grip: '123' }]);

    const req = {
      params: { id: '5' },
      body: { notation: 'Am', tuning: 'standard', grip: '123' },
    };
    const res = mockRes();

    await ChordController.patch(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Another chord already exists with this notation, tuning, and grip',
    });
  });

  test('updates and returns patched chord (200)', async () => {
    ChordModel.findById.mockResolvedValue({ id: 5, notation: 'Am', tuning: 'standard', grip: '123' });
    ChordModel.findBySelector.mockResolvedValue([]); // no conflicts
    const updated = { id: 5, notation: 'Am', tuning: 'drop d', grip: '123' };
    ChordModel.patch.mockResolvedValue(updated);

    const req = { params: { id: '5' }, body: { tuning: 'drop d' } };
    const res = mockRes();

    await ChordController.patch(req, res);

    expect(ChordModel.patch).toHaveBeenCalledWith(5, { tuning: 'drop d' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test('propagates model error status (e.g., 400)', async () => {
    ChordModel.findById.mockResolvedValue({ id: 5, notation: 'Am', tuning: 'standard', grip: '123' });
    ChordModel.findBySelector.mockResolvedValue([]);
    const e = Object.assign(new Error('tuning cannot be empty'), { status: 400 });
    ChordModel.patch.mockRejectedValue(e);

    const req = { params: { id: '5' }, body: { tuning: '' } };
    const res = mockRes();

    await ChordController.patch(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'tuning cannot be empty' });
  });
});