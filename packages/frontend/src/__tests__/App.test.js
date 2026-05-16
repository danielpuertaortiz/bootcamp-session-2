import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

let tasks;

const server = setupServer(
  rest.get('/api/tasks', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(tasks));
  }),

  rest.post('/api/tasks', (req, res, ctx) => {
    const payload = req.body;

    if (!payload.title || !payload.description || !payload.dueDate) {
      return res(ctx.status(400), ctx.json({ error: 'Missing required fields' }));
    }

    const newTask = {
      id: tasks.length + 1,
      title: payload.title,
      description: payload.description,
      dueDate: payload.dueDate,
      completed: false,
      isOverdue: false,
      createdAt: '2026-05-16T00:00:00Z',
      updatedAt: '2026-05-16T00:00:00Z',
    };

    tasks.push(newTask);
    return res(ctx.status(201), ctx.json(newTask));
  }),

  rest.patch('/api/tasks/:id', (req, res, ctx) => {
    const id = Number(req.params.id);
    const idx = tasks.findIndex((task) => task.id === id);
    if (idx < 0) {
      return res(ctx.status(404), ctx.json({ error: 'Task not found' }));
    }

    tasks[idx] = {
      ...tasks[idx],
      ...req.body,
      isOverdue: false,
    };

    return res(ctx.status(200), ctx.json(tasks[idx]));
  }),

  rest.patch('/api/tasks/:id/complete', (req, res, ctx) => {
    const id = Number(req.params.id);
    const idx = tasks.findIndex((task) => task.id === id);
    if (idx < 0) {
      return res(ctx.status(404), ctx.json({ error: 'Task not found' }));
    }

    tasks[idx] = {
      ...tasks[idx],
      completed: req.body.completed,
      isOverdue: false,
    };

    return res(ctx.status(200), ctx.json(tasks[idx]));
  }),

  rest.delete('/api/tasks/:id', (req, res, ctx) => {
    const id = Number(req.params.id);
    const idx = tasks.findIndex((task) => task.id === id);
    if (idx < 0) {
      return res(ctx.status(404), ctx.json({ error: 'Task not found' }));
    }

    tasks.splice(idx, 1);
    return res(ctx.status(200), ctx.json({ message: 'Task deleted successfully', id }));
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

beforeEach(() => {
  tasks = [
    {
      id: 1,
      title: 'Test Task 1',
      description: 'First task',
      dueDate: '2026-05-20',
      completed: false,
      isOverdue: false,
      createdAt: '2026-05-16T00:00:00Z',
      updatedAt: '2026-05-16T00:00:00Z',
    },
    {
      id: 2,
      title: 'Test Task 2',
      description: 'Second task',
      dueDate: '2026-05-10',
      completed: false,
      isOverdue: true,
      createdAt: '2026-05-16T00:00:00Z',
      updatedAt: '2026-05-16T00:00:00Z',
    },
  ];

  server.resetHandlers();
  window.confirm = jest.fn(() => true);
});

describe('App Component', () => {
  test('renders the header', async () => {
    render(<App />);
    expect(screen.getByText('TODO Planner')).toBeInTheDocument();
    expect(screen.getByText('Track tasks, due dates, and completion in one view.')).toBeInTheDocument();
  });

  test('loads and displays tasks', async () => {
    render(<App />);
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });

    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  test('adds a new task', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Task title'), 'New Test Task');
    await user.type(screen.getByLabelText('Task description'), 'Task details');
    await user.type(screen.getByLabelText('Task due date'), '2026-06-01');
    await user.click(screen.getByRole('button', { name: 'Add Task' }));

    await waitFor(() => {
      expect(screen.getByText('New Test Task')).toBeInTheDocument();
    });
  });

  test('edits a task', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    const editTitle = screen.getByLabelText('Edit task title');
    await user.clear(editTitle);
    await user.type(editTitle, 'Edited Task 1');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByText('Edited Task 1')).toBeInTheDocument();
    });
  });

  test('marks a task as done', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: 'Mark Done' })[0]);

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });

  test('deletes a task after confirmation', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    await waitFor(() => {
      expect(screen.queryByText('Test Task 1')).not.toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch tasks/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no tasks', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No tasks yet. Add your first task to get started.')).toBeInTheDocument();
    });
  });
});