const request = require('supertest');
const app = require('../src/server');

// Mock db for testing
jest.mock('../src/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rowCount: 1 }),
  },
  redis: {
    ping: jest.fn().mockResolvedValue('PONG'),
    connect: jest.fn().mockResolvedValue(),
  }
}));

describe('API Tests', () => {
  it('GET /health should return 200 and healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('database', 'connected');
    expect(res.body).toHaveProperty('cache', 'connected');
  });

  let createdTaskId;

  it('POST /api/tasks should create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test Task', description: 'Test description' });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toEqual('Test Task');
    createdTaskId = res.body.id;
  });

  it('GET /api/tasks should return tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/tasks/:id should return a task', async () => {
    const res = await request(app).get(`/api/tasks/${createdTaskId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(createdTaskId);
  });

  it('PUT /api/tasks/:id should update a task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${createdTaskId}`)
      .send({ completed: true });
    expect(res.statusCode).toEqual(200);
    expect(res.body.completed).toEqual(true);
  });

  it('DELETE /api/tasks/:id should delete a task', async () => {
    const res = await request(app).delete(`/api/tasks/${createdTaskId}`);
    expect(res.statusCode).toEqual(204);

    const getRes = await request(app).get(`/api/tasks/${createdTaskId}`);
    expect(getRes.statusCode).toEqual(404);
  });
});
