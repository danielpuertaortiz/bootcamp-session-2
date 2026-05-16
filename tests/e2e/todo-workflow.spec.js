const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');

const API_BASE_URL = 'http://127.0.0.1:3030';

async function getTasks(request) {
  const response = await request.get(`${API_BASE_URL}/api/tasks`);
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function findTaskByTitle(request, title) {
  const tasks = await getTasks(request);
  return tasks.find((task) => task.title === title);
}

async function resetTasks(request) {
  const response = await request.get(`${API_BASE_URL}/api/tasks`);
  expect(response.ok()).toBeTruthy();
  const tasks = await response.json();

  for (const task of tasks) {
    const deleteResponse = await request.delete(`${API_BASE_URL}/api/tasks/${task.id}`);
    expect(deleteResponse.ok()).toBeTruthy();
  }

  const remainingTasks = await getTasks(request);
  expect(remainingTasks).toHaveLength(0);
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

test('creates a task and persists it in backend state', async ({ page, request }) => {
  const todoPage = new TodoPage(page);
  await todoPage.goto();

  await todoPage.createTask({
    title: 'Persistent task',
    description: 'Persisted via API',
    dueDate: '2026-06-15',
  });

  const persistedTask = await findTaskByTitle(request, 'Persistent task');
  expect(persistedTask).toBeDefined();
  expect(persistedTask.description).toBe('Persisted via API');
  expect(persistedTask.dueDate).toBe('2026-06-15');
  expect(persistedTask.completed).toBe(false);
});

test('edits an existing task', async ({ page, request }) => {
  await request.post(`${API_BASE_URL}/api/tasks`, {
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

  const persistedTask = await findTaskByTitle(request, 'Task edited');
  expect(persistedTask).toBeDefined();
  expect(persistedTask.description).toBe('New description');
  expect(persistedTask.dueDate).toBe('2026-06-11');
});

test('marks a task as done', async ({ page, request }) => {
  await request.post(`${API_BASE_URL}/api/tasks`, {
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

  const persistedTask = await findTaskByTitle(request, 'Task to complete');
  expect(persistedTask).toBeDefined();
  expect(persistedTask.completed).toBe(true);
});

test('deletes a task after confirmation', async ({ page, request }) => {
  await request.post(`${API_BASE_URL}/api/tasks`, {
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

  const persistedTask = await findTaskByTitle(request, 'Task to delete');
  expect(persistedTask).toBeUndefined();
});

test('shows overdue label for past due date tasks', async ({ page, request }) => {
  await request.post(`${API_BASE_URL}/api/tasks`, {
    data: {
      title: 'Overdue task',
      description: 'Past due date task',
      dueDate: '2020-01-01',
    },
  });

  const todoPage = new TodoPage(page);
  await todoPage.goto();

  await expect(todoPage.taskItemByTitle('Overdue task').locator('.status.overdue')).toBeVisible();

  const persistedTask = await findTaskByTitle(request, 'Overdue task');
  expect(persistedTask).toBeDefined();
  expect(persistedTask.isOverdue).toBe(true);
});

test('shows validation error and does not create task when required fields are missing', async ({
  page,
  request,
}) => {
  const todoPage = new TodoPage(page);
  await todoPage.goto();

  await todoPage.addTaskButton.click();
  await expect(page.getByText('Title, description, and due date are required')).toBeVisible();

  const tasks = await getTasks(request);
  expect(tasks).toHaveLength(0);
});

test('does not delete task when confirmation dialog is canceled', async ({ page, request }) => {
  await request.post(`${API_BASE_URL}/api/tasks`, {
    data: {
      title: 'Task to keep',
      description: 'Dialog cancel path',
      dueDate: '2026-06-20',
    },
  });

  const todoPage = new TodoPage(page);
  await todoPage.goto();

  page.once('dialog', (dialog) => dialog.dismiss());
  await todoPage.taskItemByTitle('Task to keep').getByRole('button', { name: 'Delete' }).click();

  await expect(page.getByRole('heading', { name: 'Task to keep' })).toBeVisible();

  const persistedTask = await findTaskByTitle(request, 'Task to keep');
  expect(persistedTask).toBeDefined();
});

test('shows backend error message when create request fails', async ({ page, request }) => {
  const todoPage = new TodoPage(page);
  await todoPage.goto();

  await page.route('**/api/tasks', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to create task' }),
      });
      return;
    }

    await route.continue();
  });

  await todoPage.createTask({
    title: 'Will fail',
    description: 'This should fail',
    dueDate: '2026-06-21',
  });

  await expect(page.getByText('Error adding task: Failed to create task')).toBeVisible();

  await page.unroute('**/api/tasks');
  const persistedTask = await findTaskByTitle(request, 'Will fail');
  expect(persistedTask).toBeUndefined();
});
