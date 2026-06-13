# Repository Guidelines

## Project Structure & Module Organization

This repository is a VS Code extension scaffold. Keep runtime code in `src/`, with the entry point at `src/extension.ts`. Put automated tests in `src/test/` and name them `*.test.ts`. Build output is generated into `dist/` by `esbuild` and should be treated as derived artifacts. Store requirements and design notes in `docs/`, and keep editor-specific settings under `.vscode/`.

## Build, Test, and Development Commands

- `npm install`: install extension dependencies.
- `npm run compile`: type-check, lint, and bundle into `dist/extension.js`.
- `npm run watch`: run `esbuild` and TypeScript in watch mode during development.
- `npm run lint`: run ESLint on `src/`.
- `npm test`: compile tests, rebuild the extension, lint, and run the VS Code test host.
- `npm run package`: create a production bundle used by `vscode:prepublish`.

## Coding Style & Naming Conventions

Write TypeScript that matches the existing scaffold: use tabs in `src/*.ts`, keep semicolons, and prefer small functions with clear command registration flow. Follow ESLint rules in `eslint.config.mjs`; `eqeqeq`, `curly`, and `semi` warnings should be resolved before submitting changes. Use `camelCase` for variables and functions, `PascalCase` for types and classes, and keep command IDs namespaced like `awake-screen.<action>`.

## Testing Guidelines

Tests use Mocha through the VS Code test runner. Add or update tests in `src/test/` whenever extension behavior changes, especially command registration and user-visible status bar behavior. No coverage gate is configured yet, so treat regression coverage as a review requirement rather than a numeric target.

## Commit & Pull Request Guidelines

Recent history follows Conventional Commits, for example `feat: ...` and `feat(requirements): ...`. Keep commit subjects imperative and concise, and use scopes when they clarify the affected area. Pull requests should include a short summary, linked issue or requirement when available, test results from `npm test`, and screenshots or recordings for UI-visible changes inside VS Code.

## Security & Configuration Tips

Do not hardcode platform-specific power-management commands or secrets. Keep VS Code engine compatibility aligned with `package.json`, and document any new OS-level behavior in `docs/` before merging.
