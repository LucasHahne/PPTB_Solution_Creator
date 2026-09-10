# Project Plan

> Seeded by `/adopt` from the existing Solution Creator codebase and owner interview.
> Correct any `> TODO (confirm)` before treating this as final.

## 1. Problem - What problem are we solving?

Creating Dataverse schema in the maker portal is slow for multi-table solutions:
tables, columns, choice sets, and lookups are configured one dialog at a time.
Solution Creator is a Power Platform ToolBox tool that lets makers design a
solution (or target an existing unmanaged one), bulk-define tables and columns,
wire 1:N lookups, review, and deploy in one guided workflow.

## 2. Users - Who is this for?

- Power Platform / Dataverse **makers** who build solutions regularly
- **Trainers** who demonstrate schema design quickly
- Anyone who wants **efficiency** over the default maker portal UX

## 3. Features - What does the MVP need?

Already shipped (current product):

- Create or reuse unmanaged solutions and publishers
- Custom table design (ownership, notes, activities)
- Spreadsheet-style column builder with broad column types
- Local / multi-select / global choices, autonumber, file, image
- Column schema JSON export / import
- 1:N lookups with cascade config and environment table search
- Review, ordered deploy, live progress log, final publish
- Draft autosave via ToolBox settings API

Roadmap (not shipped):

- Many-to-many (M:N) relationships

## 4. Data - What are we storing?

- **In-tool draft state** (Zustand + ToolBox settings API): solution mode/draft,
  tables, fields, global choices, relationships, wizard step
- **In Dataverse** (via ToolBox / Web API): publishers, solutions, entity and
  attribute metadata, option sets, relationships, publish customizations
- No app-owned database or user accounts; auth is the active ToolBox Dataverse
  connection

## 5. Tech - What stack are we using?

- React 18 + TypeScript (strict)
- Vite 7 (IIFE bundle for ToolBox sandboxed iframe)
- Zustand for project state
- TanStack Table for the column grid
- Tailwind CSS 3 (`darkMode: 'class'`, ToolBox theme sync)
- `@pptb/types` / `window.toolboxAPI` for Dataverse and settings
- Distributed as npm package `@lucas001-yt/pptb-solution-creator` for ToolBox

## 6. Monetize - How will this make money?

Entirely **open source** (MIT). No paid tier planned. Distribution is npm +
Power Platform ToolBox registry.

## 7. UI/UX - How should this look and feel?

- Multi-step wizard: Solution → Tables → Fields → Lookups → Review & Deploy
- Dense, maker-tool feel: inline editing, dialogs for schema/choices, clear
  validation and deploy logs
- Follow ToolBox light/dark theme (`document.documentElement` `dark` class)
- Brand blues in Tailwind `brand.*`; small shared UI primitives under
  `src/components/ui/`

## 8. Deployment - Where and how will this ship?

- **App type:** ToolBox tool (static `dist/` loaded in ToolBox iframe)
- **Build:** `npm run build` (`tsc && vite build`)
- **Package:** `npm run finalize-package` then `npm publish --access public`
- **Validate:** `npm run validate` (`pptb-validate`)
- **Runtime env:** active Dataverse connection in ToolBox; user needs System
  Customizer (or higher) for metadata create
- **Repo:** https://github.com/LucasHahne/PPTB_Solution_Creator
- No Vercel/Render host; shipping is npm + ToolBox install
