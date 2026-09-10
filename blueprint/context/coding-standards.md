# Coding Standards

> Conventions for Solution Creator (Power Platform ToolBox tool). Tuned by `/adopt`
> from the real codebase. Edit when the stack or patterns change.

## TypeScript

- Strict mode enabled (`noUnusedLocals`, `noUnusedParameters`)
- Prefer domain types in `src/types/`; avoid `any` (use `unknown` when needed)
- Keep draft models (`*Draft`) separate from Web API / metadata payloads
- Path alias `@/` → `src/`

## React

- Functional components only
- Feature UI under `src/components/[feature]/`
- Shared primitives under `src/components/ui/`
- Extract ToolBox/Dataverse loading into hooks (`src/hooks/`)
- Keep wizard orchestration in layout components (`AppShell`, step containers)

## Runtime (ToolBox)

- This is a client-only iframe tool, not Next.js / SSR
- Use `window.toolboxAPI` for connections, Dataverse calls, settings, theme
- Preserve Vite IIFE build settings required for the PPTB sandbox
  (`base: './'`, no `type="module"` in shipped HTML)
- Do not assume Node APIs at runtime

## File Organization

- Components: `src/components/[feature]/ComponentName.tsx`
- Hooks: `src/hooks/useThing.ts`
- Services (Dataverse / ToolBox I/O): `src/services/`
- Metadata payload builders: `src/builders/`
- State: `src/store/projectStore.ts` (Zustand)
- Types: `src/types/`
- Constants / utils: `src/constants/`, `src/utils/`

## Naming

- Components: PascalCase (`FieldGrid.tsx`)
- Hooks: `use` + camelCase
- Functions / fields: camelCase
- Constants: SCREAMING_SNAKE_CASE or exported config objects
- Types / interfaces: PascalCase (no `I` prefix)

## State

- Project draft lives in Zustand (`projectStore`)
- Persist drafts through `settingsService` / `useDraftPersistence`, not localStorage alone
- Normalize loaded drafts so newer optional collections default safely

## Styling

- Tailwind CSS **v3** with `tailwind.config.ts`
- `darkMode: 'class'`; sync with ToolBox theme on `document.documentElement`
- Prefer existing `ui/` primitives (`Button`, `Input`, `Modal`, …) over new one-offs
- Use `brand.*` tokens when extending color usage
- Avoid inline styles unless required for dynamic layout

## Dataverse / API boundaries

- Build metadata bodies in `src/builders/*`
- Call Web API through services (`metadataService`, `solutionService`, …)
- Orchestrate multi-step create/publish in `deploymentOrchestrator`
- Validate before deploy in `validationService`
- Surface failures with clear user-facing messages (`utils/errors` where used)

## Error Handling

- Catch ToolBox / Web API failures at service or hook boundaries
- Prefer actionable messages (permission, missing header, duplicate schema name)
- Keep deploy progress visible in the deployment log UI

## Testing

No unit test runner is configured yet. Testing is **opt-in**.

The opt-in switch is a `test` command in `AGENTS.md` Commands. Until one exists,
verify logic with build, ToolBox debug install, and manual / browser evidence.
Run `/tests` when you want a real gate.

When a runner exists later:

- Prefer pure logic: parsers, naming, validators, schema merge
- Avoid brittle UI unit tests for wizard chrome
- Keep tests next to source (for example `optionSetParser.test.ts`)

## Browser Verification

- Primary verification: ToolBox Debug (local build or Install from npm)
- Optional `/browser-tests` if a harness is added later
- UI flows that matter: wizard steps, grid edits, deploy log, dialogs

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Prefer small focused functions; builders and orchestrators may be longer when
  the Dataverse payload shape requires it

## Comments

Write code that explains itself; comment only what the code cannot say.

- Comment the **why**, not the **what**
- Useful: PPTB sandbox constraints, Dataverse quirks, cascade defaults
- Prefer clear names over narrative comments
- Minimal one-line docs on non-obvious exports are fine

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs
- Use a hyphen for `term - description` separators; rephrase with commas,
  parentheses, or a colon
