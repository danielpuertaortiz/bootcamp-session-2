import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formValues, setFormValues] = useState({ title: '', description: '', dueDate: '' });
  const [editState, setEditState] = useState({
    taskId: null,
    title: '',
    description: '',
    dueDate: '',
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setTasks(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks: ' + err.message);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!formValues.title.trim() || !formValues.description.trim() || !formValues.dueDate) {
      setError('Title, description, and due date are required');
      return;
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formValues.title.trim(),
          description: formValues.description.trim(),
          dueDate: formValues.dueDate,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Failed to add task');
      }

      const result = await response.json();
      setTasks((current) => [...current, result]);
      setFormValues({ title: '', description: '', dueDate: '' });
      setError(null);
    } catch (err) {
      setError('Error adding task: ' + err.message);
      console.error('Error adding task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm('Delete this task permanently?');
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks((current) => current.filter((task) => task.id !== taskId));
      setError(null);
    } catch (err) {
      setError('Error deleting task: ' + err.message);
      console.error('Error deleting task:', err);
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (!response.ok) {
        throw new Error('Failed to update completion status');
      }

      const updated = await response.json();
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setError(null);
    } catch (err) {
      setError('Error updating task: ' + err.message);
      console.error('Error updating task:', err);
    }
  };

  const startEditTask = (task) => {
    setEditState({
      taskId: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditState((current) => ({ ...current, [name]: value }));
  };

  const cancelEdit = () => {
    setEditState({ taskId: null, title: '', description: '', dueDate: '' });
  };

  const submitEditTask = async (taskId) => {
    if (!editState.title.trim() || !editState.description.trim() || !editState.dueDate) {
      setError('Edited task must include title, description, and due date');
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editState.title.trim(),
          description: editState.description.trim(),
          dueDate: editState.dueDate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit task');
      }

      const updated = await response.json();
      setTasks((current) => current.map((task) => (task.id === taskId ? updated : task)));
      cancelEdit();
      setError(null);
    } catch (err) {
      setError('Error editing task: ' + err.message);
      console.error('Error editing task:', err);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>TODO Planner</h1>
        <p>Track tasks, due dates, and completion in one view.</p>
      </header>

      <main>
        <section className="add-item-section" aria-label="Create task section">
          <h2>Add New Task</h2>
          <form onSubmit={handleCreateTask} className="task-form">
            <input
              name="title"
              type="text"
              value={formValues.title}
              onChange={handleFormChange}
              placeholder="Task title"
              aria-label="Task title"
            />
            <input
              name="description"
              type="text"
              value={formValues.description}
              onChange={handleFormChange}
              placeholder="Task description"
              aria-label="Task description"
            />
            <input
              name="dueDate"
              type="date"
              value={formValues.dueDate}
              onChange={handleFormChange}
              aria-label="Task due date"
            />
            <button type="submit">Add Task</button>
          </form>
        </section>

        <section className="items-section" aria-label="Task list section">
          <h2>Task List</h2>
          {loading && <p>Loading tasks...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && (
            <ul className="task-list">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                    {editState.taskId === task.id ? (
                      <div className="task-edit-form">
                        <input
                          name="title"
                          type="text"
                          value={editState.title}
                          onChange={handleEditChange}
                          aria-label="Edit task title"
                        />
                        <input
                          name="description"
                          type="text"
                          value={editState.description}
                          onChange={handleEditChange}
                          aria-label="Edit task description"
                        />
                        <input
                          name="dueDate"
                          type="date"
                          value={editState.dueDate}
                          onChange={handleEditChange}
                          aria-label="Edit task due date"
                        />
                        <div className="task-actions">
                          <button type="button" onClick={() => submitEditTask(task.id)}>
                            Save
                          </button>
                          <button type="button" onClick={cancelEdit} className="secondary-btn">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="task-content">
                          <h3>{task.title}</h3>
                          <p>{task.description}</p>
                          <div className="task-meta">
                            <span>Due: {task.dueDate}</span>
                            {task.completed && <span className="status done">Done</span>}
                            {task.isOverdue && <span className="status overdue">Overdue</span>}
                          </div>
                        </div>
                        <div className="task-actions">
                          <button type="button" onClick={() => handleToggleComplete(task)}>
                            {task.completed ? 'Mark Active' : 'Mark Done'}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditTask(task)}
                            className="secondary-btn"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="delete-btn"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))
              ) : (
                <p className="empty-state">No tasks yet. Add your first task to get started.</p>
              )}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;