# Coding Guidelines

This project follows a pragmatic, quality-first engineering style for a full-stack JavaScript monorepo. The goal is to keep code easy to read, safe to change, and aligned with the product requirements for TODO management workflows.

## Core Principles

Write code that is clear before it is clever. Favor small, focused functions and components with single responsibilities. Keep behavior explicit, avoid hidden side effects, and use naming that makes intent obvious.

Build for maintainability across both packages. Because frontend and backend evolve together, changes should preserve clean boundaries between UI, API, and business behavior.

## Monorepo and Structure Expectations

The repository is organized with npm workspaces:

- `packages/frontend` for the React application
- `packages/backend` for the Express API

Keep new code in the correct package and follow existing folder conventions. Avoid cross-package coupling that leaks implementation details. Shared assumptions between frontend and backend should be documented and reflected in tests.

## JavaScript Style and Implementation Approach

Prefer consistent, straightforward JavaScript patterns over experimental abstractions. Keep functions and components small enough to scan quickly. Validate inputs at system boundaries, especially API request handling, and return predictable outputs.

When implementing TODO features, ensure behavior maps directly to functional requirements:

- create tasks with title, description, and due date
- list tasks clearly
- edit tasks
- delete tasks
- mark tasks as done
- mark tasks as overdue when current date exceeds due date

Port configuration must use environment variables with sensible defaults (for example, backend port fallback to 3030).

## Frontend Quality and UX Standards

Use Material UI components and keep the interface consistent. Accessibility is required (WCAG 2.1 AA), so ensure sufficient contrast, semantic structure, keyboard-friendly interactions, and clear labels.

Design and interaction quality should support task clarity:

- clear hierarchy in task cards or rows
- obvious status indicators for done and overdue states
- visible due dates and meaningful empty states
- confirmation for destructive actions like delete
- responsive behavior for desktop and mobile layouts

## Backend Quality and API Discipline

Keep API behavior deterministic and easy to test. Route handlers should be concise, and business logic should remain easy to isolate for unit testing. Use clear HTTP semantics and stable response shapes so frontend integration remains reliable.

## Testing as a Quality Gate

Testing is mandatory for new behavior. Use a layered strategy:

- Unit tests with Jest for isolated logic and React components
- Integration tests with Jest + Supertest for backend endpoints
- E2E tests with Playwright for critical user journeys

Testing conventions:

- Unit/integration files use `*.test.js` or `*.test.ts`
- E2E files use `*.spec.js` or `*.spec.ts`
- Frontend unit tests live in `packages/frontend/src/__tests__/`
- Backend unit tests live in `packages/backend/__tests__/`
- Backend integration tests live in `packages/backend/__tests__/integration/`
- E2E tests live in `tests/e2e/`

E2E scope should stay focused on 5-8 critical flows, use one browser, and follow the Page Object Model pattern. All tests must be isolated and independent, with setup and teardown practices that keep repeated runs reliable.

## Definition of Done

A change is considered complete when it:

- meets functional requirements
- follows project structure and style expectations
- preserves accessibility and usability standards
- includes appropriate automated tests
- remains readable and maintainable for future contributors

These guidelines are intentionally practical: prioritize clarity, predictable behavior, and test-backed confidence in every contribution.
