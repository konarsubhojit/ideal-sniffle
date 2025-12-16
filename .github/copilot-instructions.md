# Copilot Instructions

## Project Overview

This is an **Expense Management System** - a full-stack application for managing expenses between families with a React frontend and Node.js/PostgreSQL backend.

### Key Features

- Google authentication & RBAC
- Ability to include secific group members from headcount calculation
- Two types of groups- internal & external with separate level of settlement calculation

### Guidelines for development

- Create re-usable components with single responsibility
- Write project documentation at /docs/project-documentation.md and link to Readme.md - Don't add additional docs to codebase, update project documentation with new features and steps
- Write tests for backend business logic
- Follow TDD approach while modifying backend business logic

## Backend business logic (TDD required)

Any change to backend calculation/business logic MUST follow TDD:

1. Add or update tests first (red)
2. Implement the change (green)
3. Refactor while keeping tests passing

Additional rules:
- Put business logic in `backend/src/services/` (not in route handlers).
- Add/adjust tests under `backend/tests/` (or `tests/` if that’s where current tests live).
- Run the full test suite before opening a PR and include the test output in the PR description.
- If behavior is unclear, write tests to lock expected behavior before refactoring.