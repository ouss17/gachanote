# Project Contract — GachaNote

Purpose
- This file documents the project's language, frameworks, architecture, design patterns, coding conventions and concise checklists for adding features and preparing commits/PRs. It is the single-source guide that should be referenced by contributors and integrated into assistant context at conversation start.

Assistant quick-load summary (EN) — minimal context to load on new conversation:
- On new conversation, load only these sections from this file into assistant context: "Language & Framework", "Architecture & Patterns", "How to add a new feature", "Commit & PR checklist", and "Translations" (for string keys).  
- Do NOT scan the whole repo or load all source files by default. Only request specific files when the user asks or when performing code edits.  
- Prefer metadata (file paths, slice types, translations keys, serverTags) over full file contents to save resources.

Résumé assistant (FR) — contexte minimal à charger :
- À l'ouverture d'une nouvelle conversation, ne charger que : "Language & Framework", "Architecture & Patterns", "How to add a new feature", "Commit & PR checklist" et la section "Translations".  
- Ne pas parcourir l'intégralité du dépôt automatiquement. Ne charger des fichiers précis que sur demande ou pour appliquer un patch.  
- Préférer métadonnées (chemins, types des slices, clés de traduction, serverTags) plutôt que le contenu complet des fichiers.

---

**Language & Framework**:
- Primary language: TypeScript.
- Mobile framework: React Native + Expo (managed/bare depending on `android/` presence).
- State management: Redux Toolkit + react-redux.
- UI: React Native components and small shared UI components in `components/`.

**Build & Tooling**:
- Bundler / dev server: Expo CLI / `npx expo start`.
- Native builds: `eas build` or `expo run:android` / `expo run:ios` when `android/` or `ios/` exist.
- Linting: `eslint` with `eslint-config-expo`.
- Type checking: TypeScript (`tsc`) using workspace TypeScript.
- Formatting: Prettier (follow editor config if present).

**Repository structure (high level)**
- `app/` — main app source (routes, screens).
- `components/` — reusable UI components.
- `redux/` — slices, store and migrations.
- `lib/` — utilities (e.g., `StatsUtils.ts`).
- `data/` — static data and translation `texts.json`.
- `assets/` — images, fonts.
- `android/`, `ios/` — native projects when present.

**Architecture & Patterns**
- Feature modules: screens under `app/` are organized by route. Keep components small and focused.
- Containers vs Presentational: Prefer passing data and callbacks into presentational components. Keep Redux access (useSelector/useDispatch) in container screens or dedicated hooks.
- Hooks: Encapsulate repeated logic in `hooks/` (selectors, theme utilities, etc.).
- Selectors: Use memoized selectors (`reselect` / `createSelector`) for derived data to avoid unnecessary re-renders.
- Typing: Export types from slices (e.g., `Roll`, `MoneyEntry`) and import them where needed. Keep TS `strict` enabled.

**Design Patterns / Conventions**
- Single responsibility: one component = one screen/feature.
- Controlled inputs: normalize numeric input (commas => decimal point) at the component boundary.
- Date handling: store ISO strings; display localized formats in UI.
- Localization: use `data/texts.json` for strings. Access with `t(key)` helper which resolves language from Redux nationality state.
- Server tags: `GACHAS[].serverTags` is canonical; Rolls and Money entries must include a `server` field.

SOLID (applied to TypeScript / React functional code)
- Purpose: follow SOLID principles to keep code modular, testable and maintainable even in a non‑OO codebase.
- S — Single Responsibility: keep components, hooks and modules focused. One hook → one responsibility; one component → one UI concern.
- O — Open/Closed: prefer composition and extension (higher‑order hooks, render props, strategy objects) instead of changing existing functions.
- L — Liskov Substitution: design types/interfaces so implementations can be substituted without changing callers (use discriminated unions or small interfaces).
- I — Interface Segregation: prefer small, focused types and props over large monolithic interfaces.
- D — Dependency Inversion: depend on abstractions (hooks, provider contexts, injected services) rather than concrete modules; pass dependencies for easier testing.
- Practical: add unit tests for non‑trivial logic, keep selectors pure and small, and prefer composition over inheritance.

Résumé FR : appliquer SOLID de façon pragmatique — fonctions/hook/composants petits, interfaces fines, composition et injection pour tester et étendre sans modifier l'existant.
  
---

How to add a new feature (checklist)
1. Create a dedicated branch: `feat/<short-descriptor>`.
2. Add a screen or component under `app/` or `components/` as appropriate.
3. Add types to `redux/slices` if state is required. Prefer adding a new slice under `redux/slices/` or extending existing slices carefully.
4. Add selectors to `redux/selectors.ts` (memoized with `createSelector`) for any derived data.
5. Add translations to `data/texts.json` for every new visible string.
6. Update `lib/` utilities only if necessary and add unit tests if logic is non-trivial.
7. Run lint and type checks: `npm run lint` and `npx tsc --noEmit`.
8. Manual test on device/emulator; verify translations and both themes.
9. Commit with a clear message and open a PR.

Commit & PR checklist
- Commit messages: follow `type(scope): short description` (e.g., `feat(rolls): add server selector to RollForm`).
- Include rationale & short testing notes in PR description.
- Ensure no TypeScript errors and unit tests pass.
- Run `npx expo doctor` and fix reported issues if relevant.

Code review guidelines
- Verify selectors are memoized.
- Ensure components do not access Redux unnecessarily — prefer container patterns.
- Check accessibility: `accessible`, `accessibilityLabel` for interactive elements.
- Check translations keys and placeholders.

Quick examples
- Adding a selector factory:
	- create `makeSelectMoneyEntriesByGacha()` in `redux/selectors.ts` using `createSelector` and use `useMemo(()=>makeSelect...(),[])` in component then `useSelector(state => selector(state, gachaId))`.

Using this file in new conversations with the assistant
- Integration note: When opening a new conversation about this project, the assistant MUST read `copilot.md` and apply its rules (language, architecture, patterns, checklists) to proposals, code edits, and PR guidance. This ensures consistent recommendations, prevents contradictory changes, and centralizes conventions for contributors.
- Note: The feature-add checklist and commit/PR checklist already live in this file; the integration note points the assistant to use them as the authoritative source. Only repository maintainers may change these conventions.

Pourquoi (FR): cette note garantit que l'assistant suit les mêmes conventions que les contributeurs humains—d'où la nécessité d'une lecture explicite au début de chaque conversation.

---

Maintainers: add small updates to this file when conventions evolve. Keep the file concise and actionable.
