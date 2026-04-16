// tests/notationController.test.js
import { jest } from '@jest/globals';

// ------------------ Mock the model (ESM-safe) ------------------
const NotationModel = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

// Must define the mock BEFORE importing the SUT (ESM rule)
jest.unstable_mockModule('../src/models/notationModel.js', () => ({ NotationModel }));

// Dynamically import the controller AFTER the mock has been registered
const { NotationController } = await import('../src/controllers/notationController.js');

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
describe('NotationController.getAll', () => {
  test('returns all notations (200)', async () => {
    const data = [{ id: 1 }, { id: 2 }];
    NotationModel.findAll.mockResolvedValue(data);

    const req = {};
    const res = mockRes();
    await NotationController.getAll(req, res);

    expect(NotationModel.findAll).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled(); // defaults to 200
    expect(res.json).toHaveBeenCalledWith(data);
  });

  test('handles errors (500)', async () => {
    NotationModel.findAll.mockRejectedValue(new Error('db fail'));

    const req = {};
    const res = mockRes();
    await NotationController.getAll(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'db fail' });
  });
});

// ------------------ getById ------------------
describe('NotationController.getById', () => {
  test('returns the notation when found (200)', async () => {
    const notation = { id: 42, name: 'N' };
    NotationModel.findById.mockResolvedValue(notation);

    const req = { params: { id: '42' } };
    const res = mockRes();
    await NotationController.getById(req, res);

    expect(NotationModel.findById).toHaveBeenCalledWith('42');
    expect(res.json).toHaveBeenCalledWith(notation);
  });

  test('returns 404 when not found', async () => {
    NotationModel.findById.mockResolvedValue(null);

    const req = { params: { id: '99' } };
    const res = mockRes();
    await NotationController.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Notation not found' });
  });

  test('handles errors (500)', async () => {
    NotationModel.findById.mockRejectedValue(new Error('boom'));

    const req = { params: { id: '1' } };
    const res = mockRes();
    await NotationController.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'boom' });
  });
});

// ------------------ create ------------------
describe('NotationController.create', () => {
  test('creates a new notation (201)', async () => {
    const newNotation = { id: 7, name: 'A' };
    NotationModel.create.mockResolvedValue(newNotation);

    const req = { validated: { name: 'A' } };
    const res = mockRes();
    await NotationController.create(req, res);

    expect(NotationModel.create).toHaveBeenCalledWith({ name: 'A' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(newNotation);
  });

  test('returns 409 on duplicate (ER_DUP_ENTRY)', async () => {
    const dupErr = new Error('duplicate');
    dupErr.code = 'ER_DUP_ENTRY';
    NotationModel.create.mockRejectedValue(dupErr);

    const req = { validated: { name: 'A' } };
    const res = mockRes();
    await NotationController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Notation with this value already exists' });
  });

  test('returns 500 on other errors', async () => {
    NotationModel.create.mockRejectedValue(new Error('weird'));

    const req = { validated: { name: 'A' } };
    const res = mockRes();
    await NotationController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'weird' });
  });
});

// ------------------ update ------------------
describe('NotationController.update', () => {
  test('returns 404 if target not found', async () => {
    NotationModel.findById.mockResolvedValue(null);

    const req = { params: { id: '5' }, validated: { name: 'X' } };
    const res = mockRes();
    await NotationController.update(req, res);

    expect(NotationModel.findById).toHaveBeenCalledWith('5');
    expect(NotationModel.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No notation with the given id was found' });
  });

  test('updates when found (200)', async () => {
    const existing = { id: 5, name: 'Old' };
    const updated = { id: 5, name: 'New' };
    NotationModel.findById.mockResolvedValue(existing);
    NotationModel.update.mockResolvedValue(updated);

    const req = { params: { id: '5' }, validated: { name: 'New' } };
    const res = mockRes();
    await NotationController.update(req, res);

    expect(NotationModel.update).toHaveBeenCalledWith('5', { name: 'New' });
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test('returns 409 on duplicate (ER_DUP_ENTRY)', async () => {
    NotationModel.findById.mockResolvedValue({ id: 5 });
    const dupErr = new Error('duplicate');
    dupErr.code = 'ER_DUP_ENTRY';
    NotationModel.update.mockRejectedValue(dupErr);

    const req = { params: { id: '5' }, validated: { name: 'X' } };
    const res = mockRes();
    await NotationController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Notation with this value already exists' });
  });

  test('returns 500 on other errors', async () => {
    NotationModel.findById.mockResolvedValue({ id: 5 });
    NotationModel.update.mockRejectedValue(new Error('oops'));

    const req = { params: { id: '5' }, validated: { name: 'X' } };
    const res = mockRes();
    await NotationController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'oops' });
  });
});

// ------------------ remove ------------------
describe('NotationController.remove', () => {
  test('returns 404 if target not found', async () => {
    NotationModel.findById.mockResolvedValue(null);

    const req = { params: { id: '9' } };
    const res = mockRes();
    await NotationController.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No notation with the given id was found' });
  });

  test('removes when found (200)', async () => {
    const deleted = { id: 9, removed: true };
    NotationModel.findById.mockResolvedValue({ id: 9 });
    NotationModel.remove.mockResolvedValue(deleted);

    const req = { params: { id: '9' } };
    const res = mockRes();
    await NotationController.remove(req, res);

    expect(NotationModel.remove).toHaveBeenCalledWith('9');
    expect(res.json).toHaveBeenCalledWith(deleted);
  });

  test('returns 500 on errors', async () => {
    NotationModel.findById.mockResolvedValue({ id: 9 });
    NotationModel.remove.mockRejectedValue(new Error('fail'));

    const req = { params: { id: '9' } };
    const res = mockRes();
    await NotationController.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'fail' });
  });
});