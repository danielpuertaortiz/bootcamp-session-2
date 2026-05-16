# TODO App Monorepo

Full-stack JavaScript TODO application in an npm workspaces monorepo.

## Architecture

- Frontend: React app in `packages/frontend`
- Backend: Express API with in-memory SQLite in `packages/backend`
- End-to-end testing: Playwright in `tests/e2e`

## Prerequisites

- Node.js 16+
- npm 7+

## Install

```bash
npm install
```

## Run the app

Start frontend and backend together:

```bash
npm run start
```

Default ports:

- Frontend: `3000`
- Backend: `3030` (overridable with `PORT`)

## Test commands

Run frontend unit/component tests:

```bash
npm run test:frontend
```

Run backend tests:

```bash
npm run test:backend
```

Run backend integration tests only:

```bash
npm run test:integration
```

Run Playwright end-to-end tests:

```bash
npm run test:e2e
```

Install Playwright browser dependencies (first-time setup):

```bash
npm run test:e2e:install
```

Run everything:

```bash
npm run test:all
```

## API summary

The backend exposes task endpoints under `/api/tasks`:

- `GET /api/tasks`: list tasks
- `GET /api/tasks/:id`: get a task by ID
- `POST /api/tasks`: create a task (`title`, `description`, `dueDate`)
- `PATCH /api/tasks/:id`: edit task fields
- `PATCH /api/tasks/:id/complete`: mark done/active
- `DELETE /api/tasks/:id`: delete a task

Task response shape includes:

- `id`, `title`, `description`, `dueDate`, `completed`
- `createdAt`, `updatedAt`
- `isOverdue` (computed when due date is in the past and task is not completed)

## Documentation

- [Project Overview](docs/project-overview.md)
- [Functional Requirements](docs/functional-requirements.md)
- [UI Guidelines](docs/ui-guidelines.md)
- [Testing Guidelines](docs/testing-guidelines.md)
- [Coding Guidelines](docs/coding-guidelines.md)
- [Implementation Plan](docs/todo-expansion-implementation-plan.md)

## License

MIT. See [LICENSE](LICENSE).

