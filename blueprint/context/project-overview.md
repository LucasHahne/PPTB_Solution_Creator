# Solution Creator - Project Overview

<!-- blueprint:source-hash ba897f8ec377515c28aaf28275dc7a049a0eac8644274c5e648e451b15351b40 -->

> Power Platform ToolBox tool to design and deploy Dataverse schema (solutions, tables, columns, lookups) faster than the maker portal.

## Problem

Maker-portal schema work is slow for multi-table solutions: tables, columns, choices, and lookups are configured one dialog at a time. Solution Creator gives makers a single guided workflow to design a solution (or target an existing unmanaged one), bulk-define schema, review, and deploy.

## Users

- **Makers** - build Dataverse solutions regularly and want speed
- **Trainers** - demonstrate schema design without portal friction
- **Efficiency-focused users** - same ToolBox Dataverse connection; need System Customizer (or higher) to create metadata

## Features

Build-plan order. Items 1-8 are shipped; **9 is next**.

1. **Solution setup** - create or reuse unmanaged solution and publisher
2. **Table design** - custom tables with ownership, notes, activities
3. **Column builder** - spreadsheet-style fields for creatable Dataverse types
4. **Choice columns** - local, multi-select, and global choice management
5. **Column schema JSON** - export, template, import/merge by schema name
6. **1:N lookups** - cascade config plus project / standard / env table parents
7. **Review and deploy** - validation, ordered deploy, live log, publish
8. **Draft autosave** - persist and restore via ToolBox settings API
9. **M:N relationships** - many-to-many relationship design and deploy (roadmap)

Headline next: **M:N relationships**.

## Data model

No app database. Auth is the active ToolBox Dataverse connection. Two layers: in-tool draft (`SolutionProject`) and Dataverse metadata created at deploy.

### SolutionProject (draft, Zustand + settings)

- `solution` (`SolutionTarget`) - new or existing unmanaged solution
- `tables` (`EntityDraft[]`) - custom tables being designed
- `relationships` (`LookupRelationshipDraft[]`) - 1:N lookups (M:N TBD)
- `globalChoices` (`GlobalChoiceDraft[]`) - shared option sets for global choice columns

Wizard steps: `solution` → `tables` → `fields` → `relationships` → `review`.

### SolutionTarget

- `mode` (`'new' | 'existing'`)
- `existing?` - `solutionid`, names, version, `prefix`
- `draft?` (`NewSolutionDraft`) - names, version, reuse publisher or `newPublisher` (friendly/unique/prefix)

### EntityDraft

- `id`, `displayName`, `pluralName`, `schemaName` (no prefix), `description?`
- `ownershipType` (`UserOwned` | `OrganizationOwned`)
- `hasActivities`, `hasNotes`
- `fields` (`FieldDraft[]`) - exactly one `isPrimaryName`

### FieldDraft

- `id`, `type` (`FieldType`), `displayName`, `schemaName`, `description?`
- `requiredLevel` (`None` | `ApplicationRequired` | `Recommended`)
- Type-specific: `maxLength`, numeric bounds/`precision`, `defaultBoolean`, `options`, `globalChoiceId`, `autoNumberFormat`, `maxSizeInKB`, `lookupTarget`

`FieldType` includes text variants, numbers, dates, boolean, choice/multiselect/globalChoice, autonumber, file, image, lookup.

### OptionDraft / GlobalChoiceDraft

- Option: `id`, `value` (number), `label`
- Global choice: `id`, `displayName`, `schemaName`, `description?`, `options[]`
- Global choice columns reference `globalChoiceId`

### LookupRelationshipDraft (1:N)

- `childTableId` - project table (many side; lookup column created here)
- `parent` - `{ kind: 'project', tableId }` or `{ kind: 'standard', logicalName }`
- `lookupDisplayName`, `lookupSchemaName`, `cascadeDelete`, `required`

> M:N draft shape is not defined yet; lock it in `/feature 9`.

### DeploymentLogEntry (runtime UI)

- `id`, `timestamp`, `level`, `message` - not persisted as product data

### Dataverse (deploy targets)

Publishers, solutions, entity/attribute metadata, option sets, relationships, publish customizations - via `toolboxAPI` / Web API builders and services.

## Tech stack

- **React 18 + TypeScript** - ToolBox iframe UI
- **Vite 7** - IIFE `dist/` for sandboxed iframe
- **Zustand** - project draft state
- **TanStack Table** - column grid
- **Tailwind 3** - styling; `dark` class synced to ToolBox theme
- **`@pptb/types` / toolboxAPI** - Dataverse, settings, theme
- **npm `@lucas001-yt/pptb-solution-creator`** - ToolBox distribution

## Monetization

Open source (MIT). No paid tier. Ship via npm and the ToolBox registry.

## UI/UX

Dense maker-tool wizard with inline editing, dialogs, validation, and deploy log.

- **Solution** - new vs existing, publisher/prefix
- **Tables** - entity list/editor
- **Fields** - grid, choice/global managers, schema JSON
- **Lookups** - 1:N editor (M:N later)
- **Review & Deploy** - summary, progress log, publish

Shared UI under `src/components/ui/`; brand blues via Tailwind `brand.*`.

## Deployment

- **Type:** static ToolBox tool (`dist/`), not a hosted web app
- **Build:** `npm run build` (`tsc && vite build`)
- **Package:** `npm run finalize-package` then `npm publish --access public`
- **Validate:** `npm run validate` (`pptb-validate`)
- **Runtime:** ToolBox + active Dataverse connection; System Customizer+
- **Repo:** https://github.com/LucasHahne/PPTB_Solution_Creator

## Open questions

- M:N UX and draft model (intersect vs native relationship API, schema naming, deploy order) - resolve in `/feature 9`
- Blueprint git visibility still unset (commit workflow files vs local-only) - decide before a baseline commit
