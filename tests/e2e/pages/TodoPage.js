class TodoPage {
  constructor(page) {
    this.page = page;
    this.titleInput = page.getByLabel('Task title');
    this.descriptionInput = page.getByLabel('Task description');
    this.dueDateInput = page.getByLabel('Task due date');
    this.addTaskButton = page.getByRole('button', { name: 'Add Task' });
  }

  async goto() {
    await this.page.goto('/');
    await this.page.getByRole('heading', { name: 'TODO Planner' }).waitFor();
  }

  async createTask(task) {
    await this.titleInput.fill(task.title);
    await this.descriptionInput.fill(task.description);
    await this.dueDateInput.fill(task.dueDate);
    await this.addTaskButton.click();
  }

  taskItemByTitle(title) {
    return this.page.locator('.task-item').filter({
      has: this.page.getByRole('heading', { name: title }),
    });
  }

  async openEditForTask(title) {
    const taskItem = this.taskItemByTitle(title);
    await taskItem.getByRole('button', { name: 'Edit' }).click();
  }

  async editTaskValues(values) {
    if (values.title) {
      await this.page.getByLabel('Edit task title').fill(values.title);
    }

    if (values.description) {
      await this.page.getByLabel('Edit task description').fill(values.description);
    }

    if (values.dueDate) {
      await this.page.getByLabel('Edit task due date').fill(values.dueDate);
    }

    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async markDone(title) {
    const taskItem = this.taskItemByTitle(title);
    await taskItem.getByRole('button', { name: 'Mark Done' }).click();
  }

  async deleteTask(title) {
    const taskItem = this.taskItemByTitle(title);
    this.page.once('dialog', (dialog) => dialog.accept());
    await taskItem.getByRole('button', { name: 'Delete' }).click();
  }
}

module.exports = { TodoPage };
