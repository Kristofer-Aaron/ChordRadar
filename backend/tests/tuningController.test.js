// tests/tuningController.test.js
import { jest } from '@jest/globals';

// ------------------ ESM mocks ------------------
// Model methods we call from the controller
const TuningModel = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

// Mock the modules BEFORE importing the SUT (ESM rule)
jest.unstable_mockModule('../src/models/tuningModel.js', () => ({ TuningModel }));

// Import the SUT AFTER mocks are registered
const { TuningController } = await import('../src/controllers/tuningController.js');

// ------------------ Response helper ------------------
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ------------------ getAll ------------------
describe('TuningController.getAll', () => {
  test('returns all tunings (200)', async () => {
    const data = [{ id: 1 }, { id: 2 }];
    TuningModel.findAll.mockResolvedValue(data);

    const req = {};
    const res = mockRes();
    await TuningController.getAll(req, res);

    expect(TuningModel.findAll).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled(); // defaults to 200
    expect(res.json).toHaveBeenCalledWith(data);
  });

  test('handles errors (500)', async () => {
    TuningModel.findAll.mockRejectedValue(new Error('db fail'));

    const req = {};
    const res = mockRes();
    await TuningController.getAll(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'db fail' });
  });
});

// ------------------ getById ------------------
describe('TuningController.getById', () => {
  test('returns a tuning when found (200)', async () => {
    const tuning = { id: 42, name: 'Standard' };
    TuningModel.findById.mockResolvedValue(tuning);

    const req = { params: { id: '42' } };
    const res = mockRes();
    await TuningController.getById(req, res);

    expect(TuningModel.findById).toHaveBeenCalledWith('42');
    expect(res.json).toHaveBeenCalledWith(tuning);
  });

  test('returns 404 when not found', async () => {
    TuningModel.findById.mockResolvedValue(null);

    const req = { params: { id: '99' } };
    const res = mockRes();
    await TuningController.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Tuning not found' });
  });

  test('handles errors (500)', async () => {
    TuningModel.findById.mockRejectedValue(new Error('boom'));

    const req = { params: { id: '1' } };
    const res = mockRes();
    await TuningController.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'boom' });
  });
});

// ------------------ create ------------------
describe('TuningController.create', () => {
  test('creates a new tuning (201)', async () => {
    const newTuning = { id: 7, name: 'Drop D' };
    TuningModel.create.mockResolvedValue(newTuning);

    const req = { validated: { name: 'Drop D' } };
    const res = mockRes();
    await TuningController.create(req, res);

    expect(TuningModel.create).toHaveBeenCalledWith({ name: 'Drop D' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(newTuning);
  });

  test('returns 409 on duplicate (ER_DUP_ENTRY)', async () => {
    const dupErr = new Error('duplicate');
    dupErr.code = 'ER_DUP_ENTRY';
    TuningModel.create.mockRejectedValue(dupErr);

    const req = { validated: { name: 'Standard' } };
    const res = mockRes();
    await TuningController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Tuning with this value already exists' });
  });

  test('returns 500 on other errors', async () => {
    TuningModel.create.mockRejectedValue(new Error('weird'));

    const req = { validated: { name: 'Open G' } };
    const res = mockRes();
    await TuningController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'weird' });
  });
});

// ------------------ update ------------------
describe('TuningController.update', () => {
  test('returns 404 if target not found', async () => {
    TuningModel.findById.mockResolvedValue(null);

    const req = { params: { id: '5' }, validated: { name: 'Alt' } };
    const res = mockRes();
    await TuningController.update(req, res);

    expect(TuningModel.findById).toHaveBeenCalledWith('5');
    expect(TuningModel.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No tuning with the given id was found' });
  });

  test('updates when found (200)', async () => {
    const existing = { id: 5, name: 'Old' };
    const updated = { id: 5, name: 'New' };
    TuningModel.findById.mockResolvedValue(existing);
    TuningModel.update.mockResolvedValue(updated);

    const req = { params: { id: '5' }, validated: { name: 'New' } };
    const res = mockRes();
    await TuningController.update(req, res);

    expect(TuningModel.update).toHaveBeenCalledWith('5', { name: 'New' });
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test('returns 409 on duplicate (ER_DUP_ENTRY)', async () => {
    TuningModel.findById.mockResolvedValue({ id: 5 });
    const dupErr = new Error('duplicate');
    dupErr.code = 'ER_DUP_ENTRY';
    TuningModel.update.mockRejectedValue(dupErr);

    const req = { params: { id: '5' }, validated: { name: 'Standard' } };
    const res = mockRes();
    await TuningController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Tuning with this value already exists' });
  });

  test('returns 500 on other errors', async () => {
    TuningModel.findById.mockResolvedValue({ id: 5 });
    TuningModel.update.mockRejectedValue(new Error('oops'));

    const req = { params: { id: '5' }, validated: { name: 'X' } };
    const res = mockRes();
    await TuningController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'oops' });
  });
});

// ------------------ remove ------------------
describe('TuningController.remove', () => {
  test('returns 404 if target not found', async () => {
    TuningModel.findById.mockResolvedValue(null);

    const req = { params: { id: '9' } };
    const res = mockRes();
    await TuningController.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No tuning with the given id was found' });
  });

  test('removes when found (200)', async () => {
    const deleted = { id: 9, removed: true };
    TuningModel.findById.mockResolvedValue({ id: 9 });
    TuningModel.remove.mockResolvedValue(deleted);

    const req = { params: { id: '9' } };
    const res = mockRes();
    await TuningController.remove(req, res);

    expect(TuningModel.remove).toHaveBeenCalledWith('9');
    expect(res.json).toHaveBeenCalledWith(deleted);
  });

  test('returns 500 on errors', async () => {
    TuningModel.findById.mockResolvedValue({ id: 9 });
    TuningModel.remove.mockRejectedValue(new Error('fail'));

    const req = { params: { id: '9' } };
    const res = mockRes();
    await TuningController.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
  });
});