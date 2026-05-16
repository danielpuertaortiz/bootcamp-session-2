const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

function pad2(value) {
  return value.toString().padStart(2, '0');
}

function todayDateString(now = new Date()) {
  const year = now.getFullYear();
  const month = pad2(now.getMonth() + 1);
  const day = pad2(now.getDate());
  return `${year}-${month}-${day}`;
}

function normalizeDueDate(input) {
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return null;
  }

  const parsed = new Date(`${input}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const normalized = parsed.toISOString().slice(0, 10);
  return normalized === input ? normalized : null;
}

function computeIsOverdue(task, now = new Date()) {
  if (!task || !task.dueDate) {
    return false;
  }

  return !task.completed && task.dueDate < todayDateString(now);
}

function parseTaskRow(row, now = new Date()) {
  const task = {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return {
    ...task,
    isOverdue: computeIsOverdue(task, now),
  };
}

function parseId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function initializeDatabase(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      due_date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const seedTasks = [
    {
      title: 'Prepare sprint board',
      description: 'Add TODO backlog items and estimate effort.',
      dueDate: '2026-05-20',
    },
    {
      title: 'Review API contracts',
      description: 'Verify request and response payloads with frontend.',
      dueDate: '2026-05-22',
    },
  ];

  const insertTask = db.prepare(
    'INSERT INTO tasks (title, description, due_date, completed) VALUES (?, ?, ?, ?)'
  );

  seedTasks.forEach((task) => {
    insertTask.run(task.title, task.description, task.dueDate, 0);
  });
}

function validateCreatePayload(payload) {
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const description = typeof payload.description === 'string' ? payload.description.trim() : '';
  const dueDate = normalizeDueDate(payload.dueDate);

  if (!title) {
    return { error: 'Task title is required' };
  }

  if (!description) {
    return { error: 'Task description is required' };
  }

  if (!dueDate) {
    return { error: 'Task dueDate must use YYYY-MM-DD format' };
  }

  return { value: { title, description, dueDate } };
}

function createApp() {
  const app = express();
  const db = new Database(':memory:');
  initializeDatabase(db);

  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  const getTaskById = db.prepare('SELECT * FROM tasks WHERE id = ?');
  const listTasks = db.prepare('SELECT * FROM tasks ORDER BY due_date ASC, id ASC');
  const insertTask = db.prepare(
    'INSERT INTO tasks (title, description, due_date, completed) VALUES (?, ?, ?, ?)'
  );
  const deleteTask = db.prepare('DELETE FROM tasks WHERE id = ?');

  app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend server is running' });
  });

  app.get('/api/tasks', (req, res) => {
    try {
      const rows = listTasks.all();
      res.json(rows.map((row) => parseTaskRow(row)));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.get('/api/tasks/:id', (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Valid task ID is required' });
      }

      const row = getTaskById.get(id);
      if (!row) {
        return res.status(404).json({ error: 'Task not found' });
      }

      return res.json(parseTaskRow(row));
    } catch (error) {
      console.error('Error fetching task:', error);
      return res.status(500).json({ error: 'Failed to fetch task' });
    }
  });

  app.post('/api/tasks', (req, res) => {
    try {
      const validation = validateCreatePayload(req.body || {});
      if (validation.error) {
        return res.status(400).json({ error: validation.error });
      }

      const { title, description, dueDate } = validation.value;
      const result = insertTask.run(title, description, dueDate, 0);
      const newTask = getTaskById.get(result.lastInsertRowid);
      return res.status(201).json(parseTaskRow(newTask));
    } catch (error) {
      console.error('Error creating task:', error);
      return res.status(500).json({ error: 'Failed to create task' });
    }
  });

  app.patch('/api/tasks/:id', (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Valid task ID is required' });
      }

      const existingTask = getTaskById.get(id);
      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const updates = [];
      const values = [];
      const payload = req.body || {};

      if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
        if (typeof payload.title !== 'string' || payload.title.trim() === '') {
          return res.status(400).json({ error: 'Task title must be a non-empty string' });
        }
        updates.push('title = ?');
        values.push(payload.title.trim());
      }

      if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
        if (typeof payload.description !== 'string' || payload.description.trim() === '') {
          return res.status(400).json({ error: 'Task description must be a non-empty string' });
        }
        updates.push('description = ?');
        values.push(payload.description.trim());
      }

      if (Object.prototype.hasOwnProperty.call(payload, 'dueDate')) {
        const normalizedDueDate = normalizeDueDate(payload.dueDate);
        if (!normalizedDueDate) {
          return res.status(400).json({ error: 'Task dueDate must use YYYY-MM-DD format' });
        }
        updates.push('due_date = ?');
        values.push(normalizedDueDate);
      }

      if (Object.prototype.hasOwnProperty.call(payload, 'completed')) {
        if (typeof payload.completed !== 'boolean') {
          return res.status(400).json({ error: 'Task completed must be a boolean' });
        }
        updates.push('completed = ?');
        values.push(payload.completed ? 1 : 0);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'At least one editable field is required' });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      const statement = db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`);
      statement.run(...values, id);

      const updatedTask = getTaskById.get(id);
      return res.json(parseTaskRow(updatedTask));
    } catch (error) {
      console.error('Error updating task:', error);
      return res.status(500).json({ error: 'Failed to update task' });
    }
  });

  app.patch('/api/tasks/:id/complete', (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Valid task ID is required' });
      }

      const existingTask = getTaskById.get(id);
      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const completed = Object.prototype.hasOwnProperty.call(req.body || {}, 'completed')
        ? req.body.completed
        : true;

      if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'Task completed must be a boolean' });
      }

      db.prepare('UPDATE tasks SET completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        completed ? 1 : 0,
        id
      );

      const updatedTask = getTaskById.get(id);
      return res.json(parseTaskRow(updatedTask));
    } catch (error) {
      console.error('Error marking task as complete:', error);
      return res.status(500).json({ error: 'Failed to mark task as complete' });
    }
  });

  app.delete('/api/tasks/:id', (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Valid task ID is required' });
      }

      const existingTask = getTaskById.get(id);
      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      deleteTask.run(id);
      return res.json({ message: 'Task deleted successfully', id });
    } catch (error) {
      console.error('Error deleting task:', error);
      return res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  return { app, db };
}

const { app, db } = createApp();

module.exports = {
  app,
  db,
  createApp,
  todayDateString,
  normalizeDueDate,
  computeIsOverdue,
};