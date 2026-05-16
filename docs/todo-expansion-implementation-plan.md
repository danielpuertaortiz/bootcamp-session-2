# TODO App Expansion Plan

This checklist translates the project guidance from the documentation set into an implementation sequence that is easy to track while building.

## Scope Anchor

The expansion covers the functional requirements documented in `docs/functional-requirements.md`, aligns UI behavior with `docs/ui-guidelines.md`, follows implementation principles in `docs/coding-guidelines.md`, and enforces quality gates from `docs/testing-guidelines.md`.

## Delivery Checklist

- [x] Define phased implementation plan and acceptance criteria
- [x] Phase 1: Backend foundations
- [x] Phase 2: Frontend feature alignment
- [x] Phase 3: End-to-end user journeys
- [x] Phase 4: Documentation and release readiness

## Phase 1: Backend Foundations

- [x] Replace item-centric API with task-centric endpoints
- [x] Support create/list/read/update/delete for tasks
- [x] Support mark-as-done endpoint
- [x] Enforce input validation for title, description, and due date
- [x] Expose overdue status based on due date and completion state
- [x] Keep environment-based port defaults intact
- [x] Add backend unit tests for date/overdue logic
- [x] Add backend integration tests for task API contracts

## Phase 2: Frontend Feature Alignment

- [x] Update UI state and API calls to the task contract
- [x] Implement add-task flow with title, description, due date
- [x] Render task list with done and overdue visual states
- [x] Implement edit, delete, and mark-done interactions
- [x] Add confirmation for destructive actions
- [x] Ensure responsive behavior and accessibility compliance
- [x] Add frontend unit/component tests for critical interactions

## Phase 3: End-to-End User Journeys

- [x] Configure Playwright journeys with Page Object Model
- [x] Add 5-8 critical workflows (single browser)
- [x] Ensure test isolation with setup/teardown
- [x] Validate happy path and key edge cases

## Phase 4: Documentation and Release Readiness

- [x] Update README run/test instructions if needed
- [x] Verify docs reflect final API/UI behavior
- [x] Run full test suite (`npm run test:all`)
- [x] Resolve regressions and finalize merge-ready status

## Current Status

All phases are complete. Backend, frontend, integration, and end-to-end tests are passing, and documentation is aligned with the implemented task workflow.
