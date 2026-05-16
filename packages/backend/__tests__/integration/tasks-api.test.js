const request = require('supertest');
const { createApp } = require('../../src/app');

describe('Tasks API integration tests', () => {
  let app;
  let db;

  beforeEach(() => {
    const instance = createApp();
    app = instance.app;
    db = instance.db;
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  it('returns seeded tasks from GET /api/tasks', async () => {
    const response = await request(app).get('/api/tasks');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    const task = response.body[0];
    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('title');
    expect(task).toHaveProperty('description');
    expect(task).toHaveProperty('dueDate');
    expect(task).toHaveProperty('completed');
    expect(task).toHaveProperty('isOverdue');
  });

  it('creates a task with POST /api/tasks', async () => {
    const payload = {
      title: 'Write backend docs',
      description: 'Document tasks endpoint behavior.',
      dueDate: '2026-05-30',
    };

    const response = await request(app)
      .post('/api/tasks')
      .send(payload)
      .set('Accept', 'application/json');

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: payload.title,
      description: payload.description,
      dueDate: payload.dueDate,
      completed: false,
      isOverdue: false,
    });
  });

  it('validates required create fields', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: '', description: '', dueDate: 'bad-date' })
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('edits task fields with PATCH /api/tasks/:id', async () => {
    const createResponse = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Initial title',
        description: 'Initial description',
        dueDate: '2026-05-25',
      })
      .set('Accept', 'application/json');

    const editResponse = await request(app)
      .patch(`/api/tasks/${createResponse.body.id}`)
      .send({
        title: 'Updated title',
        description: 'Updated description',
        dueDate: '2026-05-26',
      })
      .set('Accept', 'application/json');

    expect(editResponse.status).toBe(200);
    expect(editResponse.body).toMatchObject({
      id: createResponse.body.id,
      title: 'Updated title',
      description: 'Updated description',
      dueDate: '2026-05-26',
    });
  });

  it('marks a task as done with PATCH /api/tasks/:id/complete', async () => {
    const createResponse = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Mark done',
        description: 'Complete this task',
        dueDate: '2026-05-25',
      })
      .set('Accept', 'application/json');

    const doneResponse = await request(app)
      .patch(`/api/tasks/${createResponse.body.id}/complete`)
      .send({ completed: true })
      .set('Accept', 'application/json');

    expect(doneResponse.status).toBe(200);
    expect(doneResponse.body).toHaveProperty('completed', true);
    expect(doneResponse.body).toHaveProperty('isOverdue', false);
  });

  it('deletes a task with DELETE /api/tasks/:id', async () => {
    const createResponse = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Delete me',
        description: 'Temporary task',
        dueDate: '2026-05-25',
      })
      .set('Accept', 'application/json');

    const deleteResponse = await request(app).delete(`/api/tasks/${createResponse.body.id}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({
      message: 'Task deleted successfully',
      id: createResponse.body.id,
    });

    const notFoundResponse = await request(app).get(`/api/tasks/${createResponse.body.id}`);
    expect(notFoundResponse.status).toBe(404);
  });
});
