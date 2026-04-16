// gripController.test.js
import { jest } from '@jest/globals';

// ------------- ESM mock of ../models/gripModel.js -----------------
const GripModel = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

// Tell Jest to replace the ESM module with our mock BEFORE importing the SUT
jest.unstable_mockModule('../src/models/gripModel.js', () => ({
  GripModel,
}));

// Now import the SUT (subject under test) AFTER the mock is set up
const { GripController } = await import('../src/controllers/gripController.js');

// ------------- Helpers --------------------------------------------
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json  = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ------------- Tests: getAll --------------------------------------
describe('GripController.getAll', () => {
  test('returns all grips (200)', async () => {
    const data = [{ id: 1 }, { id: 2 }];
    GripModel.findAll.mockResolvedValue(data);

    const req = {};
    const res = mockRes();
    await GripController.getAll(req, res);

    expect(GripModel.findAll).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled(); // defaults to 200
    expect(res.json).toHaveBeenCalledWith(data);
  });

  test('handles errors (500)', async () => {
    GripModel.findAll.mockRejectedValue(new Error('db fail'));

    const req = {};
    const res = mockRes();
    await GripController.getAll(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'db fail' });
  });
});

// ------------- Tests: getById -------------------------------------
describe('GripController.getById', () => {
  test('returns the grip when found (200)', async () => {
    const grip = { id: 42 };
    GripModel.findById.mockResolvedValue(grip);

    const req = { params: { id: '42' } };
    const res = mockRes();
    await GripController.getById(req, res);

    expect(GripModel.findById).toHaveBeenCalledWith('42');
    expect(res.json).toHaveBeenCalledWith(grip);
  });

  test('returns 404 when not found', async () => {
    GripModel.findById.mockResolvedValue(null);

    const req = { params: { id: '99' } };
    const res = mockRes();
    await GripController.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Grip not found' });
  });

  test('handles errors (500)', async () => {
    GripModel.findById.mockRejectedValue(new Error('boom'));

    const req = { params: { id: '1' } };
    const res = mockRes();
    await GripController.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'boom' });
  });
});

// ------------- Tests: create --------------------------------------
describe('GripController.create', () => {
  test('creates new grip (201)', async () => {
    const newGrip = { id: 7, name: 'A' };
    GripModel.create.mockResolvedValue(newGrip);

    const req = { validated: { name: 'A' } };
    const res = mockRes();
    await GripController.create(req, res);

    expect(GripModel.create).toHaveBeenCalledWith({ name: 'A' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(newGrip);
  });

  test('returns 409 on duplicate (ER_DUP_ENTRY)', async () => {
    const dupErr = new Error('duplicate');
    dupErr.code = 'ER_DUP_ENTRY';
    GripModel.create.mockRejectedValue(dupErr);

    const req = { validated: { name: 'A' } };
    const res = mockRes();
    await GripController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Grip with this value already exists' });
  });

  test('returns 500 on other errors', async () => {
    GripModel.create.mockRejectedValue(new Error('weird'));

    const req = { validated: { name: 'A' } };
    const res = mockRes();
    await GripController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'weird' });
  });
});

// ------------- Tests: update --------------------------------------
describe('GripController.update', () => {
  test('returns 404 if target not found', async () => {
    GripModel.findById.mockResolvedValue(null);

    const req = { params: { id: '5' }, validated: { name: 'X' } };
    const res = mockRes();
    await GripController.update(req, res);

    expect(GripModel.findById).toHaveBeenCalledWith('5');
    expect(GripModel.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No grip with the given id was found' });
  });

  test('updates when found (200)', async () => {
    const existing = { id: 5, name: 'Old' };
    const updated = { id: 5, name: 'New' };
    GripModel.findById.mockResolvedValue(existing);
    GripModel.update.mockResolvedValue(updated);

    const req = { params: { id: '5' }, validated: { name: 'New' } };
    const res = mockRes();
    await GripController.update(req, res);

    expect(GripModel.update).toHaveBeenCalledWith('5', { name: 'New' });
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test('returns 409 on duplicate (ER_DUP_ENTRY)', async () => {
    GripModel.findById.mockResolvedValue({ id: 5 });
    const dupErr = new Error('duplicate');
    dupErr.code = 'ER_DUP_ENTRY';
    GripModel.update.mockRejectedValue(dupErr);

    const req = { params: { id: '5' }, validated: { name: 'X' } };
    const res = mockRes();
    await GripController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Grip with this value already exists' });
  });

  test('returns 500 on other errors', async () => {
    GripModel.findById.mockResolvedValue({ id: 5 });
    GripModel.update.mockRejectedValue(new Error('oops'));

    const req = { params: { id: '5' }, validated: { name: 'X' } };
    const res = mockRes();
    await GripController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'oops' });
  });
});

// ------------- Tests: remove --------------------------------------
describe('GripController.remove', () => {
  test('returns 404 if target not found', async () => {
    GripModel.findById.mockResolvedValue(null);

    const req = { params: { id: '9' } };
    const res = mockRes();
    await GripController.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No grip with the given id was found' });
  });

  test('removes when found (200)', async () => {
    const deleted = { id: 9, removed: true };
    GripModel.findById.mockResolvedValue({ id: 9 });
    GripModel.remove.mockResolvedValue(deleted);

    const req = { params: { id: '9' } };
    const res = mockRes();
    await GripController.remove(req, res);

    expect(GripModel.remove).toHaveBeenCalledWith('9');
    expect(res.json).toHaveBeenCalledWith(deleted);
  });

  test('returns 500 on errors', async () => {
    GripModel.findById.mockResolvedValue({ id: 9 });
    GripModel.remove.mockRejectedValue(new Error('fail'));

    const req = { params: { id: '9' } };
    const res = mockRes();
    await GripController.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
  });
});