const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');

async function resetTasks(request) {
  const response = await request.get('http://127.0.0.1:3030/api/tasks');
  const tasks = await response.json();

  for (const task of tasks) {
    await request.delete(`http://127.0.0.1:3030/api/tasks/${task.id}`);
  }
}

test.beforeEach(async ({ request }) => {
  await resetTasks(request);
});

test('creates a task and displays it in the list', async ({ page }) => {
  const todoPage = new TodoPage(page);
  await todoPage.goto();

  await todoPage.createTask({
    title: 'Create flow task',
    description: 'Validate create journey',
    dueDate: '2026-06-05',
  });

  await expect(page.getByRole('heading', { name: 'Create flow task' })).toBeVisible();
  await expect(page.getByText('Due: 2026-06-05')).toBeVisible();
});

test('edits an existing task', async ({ page, request }) => {
  await request.post('http://127.0.0.1:3030/api/tasks', {
    data: {
      title: 'Task to edit',
      description: 'Old description',
      dueDate: '2026-06-10',
    },
  });

  const todoPage = new TodoPage(page);
  await todoPage.goto();

  await todoPage.openEditForTask('Task to edit');
  await todoPage.editTaskValues({
    title: 'Task edited',
    description: 'New description',
    dueDate: '2026-06-11',
  });

  await expect(page.getByRole('heading', { name: 'Task edited' })).toBeVisible();
  await expect(page.getByText('New description')).toBeVisible();
  await expect(page.getByText('Due: 2026-06-11')).toBeVisible();
});

test('marks a task as done', async ({ page, request }) => {
  await request.post('http://127.0.0.1:3030/api/tasks', {
    data: {
      title: 'Task to complete',
      description: 'Completion test',
      dueDate: '2026-06-12',
    },
  });

  const todoPage = new TodoPage(page);
  await todoPage.goto();

  await todoPage.markDone('Task to complete');
  await expect(todoPage.taskItemByTitle('Task to complete').getByText('Done')).toBeVisible();
});

test('deletes a task after confirmation', async ({ page, request }) => {
  await request.post('http://127.0.0.1:3030/api/tasks', {
    data: {
      title: 'Task to delete',
      description: 'Delete test',
      dueDate: '2026-06-13',
    },
  });

  const todoPage = new TodoPage(page);
  await todoPage.goto();

  await todoPage.deleteTask('Task to delete');
  await expect(page.getByRole('heading', { name: 'Task to delete' })).toHaveCount(0);
});

test('shows overdue label for past due date tasks', async ({ page, request }) => {
  await request.post('http://127.0.0.1:3030/api/tasks', {
    data: {
      title: 'Overdue task',
      description: 'Past due date task',
      dueDate: '2020-01-01',
    },
  });

  const todoPage = new TodoPage(page);
  await todoPage.goto();

  await expect(todoPage.taskItemByTitle('Overdue task').locator('.status.overdue')).toBeVisible();
});
