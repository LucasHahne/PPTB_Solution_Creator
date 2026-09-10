# Solution Creator

[![npm](https://img.shields.io/npm/v/@lucas001-yt/pptb-solution-creator.svg?color=blue)](https://www.npmjs.com/package/@lucas001-yt/pptb-solution-creator)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/LucasHahne/PPTB_Solution_Creator/blob/main/LICENSE)
[![Power Platform ToolBox](https://img.shields.io/badge/Power%20Platform-ToolBox-327dfb.svg)](https://docs.powerplatformtoolbox.com/tool-development)

A [Power Platform ToolBox](https://docs.powerplatformtoolbox.com/tool-development) tool that lets you design and deploy Dataverse schema much faster than the maker portal. Create a new solution (or target an existing one), add tables, bulk-define columns of every common type, wire up 1:N lookups, review, and deploy — all from a single guided workflow.

Install from npm: [`@lucas001-yt/pptb-solution-creator`](https://www.npmjs.com/package/@lucas001-yt/pptb-solution-creator)

## Features

- **Create or reuse solutions** — spin up a brand-new publisher and solution, or add to an existing unmanaged one.

- **Fast table design** — add multiple custom tables with ownership, notes, and activities settings.

- **Spreadsheet-style column builder** — inline editing, per-type sensible defaults, duplicate rows, and "add 5".

- **Column schema JSON** — export the active table's columns as JSON, download or copy a sample template (with a full type reference), and import via file upload or paste with validation and merge-by-schema-name.

- **Every creatable column type** — single/multi-line text, email, URL, phone, autonumber, whole number, big whole number, decimal, floating point, currency, date, date & time, yes/no, local choice, multi-select choice, global choice, file, and image.

- **Column bounds validation** — maximum length, numeric range, precision, and file/image size are enforced against Dataverse limits before deploy.

- **Choice option editor** — configure local and multi-select choice columns with Choice / Choice value pairs and bulk paste (`Active:1, Inactive:2`).

- **Global choices** — define shared option sets once in the Global choices manager, then bind any number of "Choice (global)" columns to them; created before columns and reused on retry. Names that already exist in the environment are detected and reused instead of being created again.

- **Autonumber columns** — configure the format (e.g. `INV-{SEQNUM:5}`) and maximum length.

- **1:N lookups** — relate tables with cascade configuration; pick the parent from your project tables, the common standard tables, or any searchable table in the connected environment.

- **Review & deploy** — validation summary, ordered deployment, a live progress log, and a single publish at the end.

- **Draft autosave** — work is persisted via the ToolBox settings API and restored when you reopen the tool.

## Workflow

1. **Solution** — choose new or existing, configure the publisher prefix.

2. **Tables** — add custom tables and their primary name column.

3. **Fields** — define columns per table, or bulk-import from a validated JSON schema.

4. **Lookups** — add 1:N relationships.

5. **Review & Deploy** — confirm and push to Dataverse.

> Many-to-many relationships are out of scope; Dataverse requires a bridge table for those.

## Requirements

- [Power Platform ToolBox](https://docs.powerplatformtoolbox.com/) with an **active Dataverse connection** to the target environment.

- ToolBox API **1.0.20+** (declared via `features.minAPI`) for the metadata create operations.

- The connected user needs the **System Customizer** (or System Administrator) role to create publishers, solutions, tables, columns, and relationships.

## Update history

### 1.1.7

- **M:N relationships** — the Lookups step now supports many-to-many via an explicit bridge table (autonumber primary, two lookups). Defaults: display `Bridge {Left} {Right}`, schema `Bridge{Left}{Right}`, lookups `Lookup{Left}` / `Lookup{Right}` (all editable). Deploy creates the bridge table then the two lookups and shares the final publish.
- **1:N lookup naming aligned** — Add lookup defaults to parent display name and schema `Lookup{Parent}` (same pattern as M:N), regenerating until you edit the fields.

### 1.1.6

- Fixed shrinkwrap issue for npm package deployment.

### 1.1.5

- Fixed dark mode on selected surfaces ([#3](https://github.com/LucasHahne/PPTB_Solution_Creator/issues/3)). The `brand` palette was missing its `950` shade, so the solution mode cards, the selected table in the Tables sidebar, and info notices kept a light background behind light text.
- **Searchable lookup parents** — the Add lookup dialog now offers every table in the connected environment, searchable by display name or logical name and grouped into project, common, and environment tables. It previously reported how many tables existed while only offering five standard ones. Intersect (bridge) tables are filtered out since they cannot be lookup parents.
- The lookup name fields now suggest a placeholder derived from the selected child table.
- **More resilient lookup deployment** — relationship creates that Dataverse accepts but the host cannot acknowledge no longer abort the deploy or collide on retry:
  - Relationship lookups fall back to listing the parent's relationships even when the keyed request succeeds without an id, and then to the child's (much smaller) `ManyToOneRelationships`.
  - `0x80072551` (`NavigationPropertyName … is not unique`) is treated as "already created" and recovered by lookup, with one short retry for metadata lag.
  - A lookup is skipped when the child table already has its lookup column, not just when the relationship is found by schema name.
  - Navigation property names are now set explicitly so they are deterministic rather than derived from the relationship schema name.
- **Global choices are checked against the environment** — a name already used by a global option set in the connected environment cannot be created a second time. The Global choices manager now flags those entries, hides the local option editor for them (their options are managed in the environment), and the Review step warns that they will be reused as-is. Rename the schema name to define a separate global choice instead.
- **Collapsible global choices** — once there is more than one, each collapses to a summary row showing its display name, prefixed schema name, and option count (or the "already in environment" flag), so a long list stays manageable. Newly added choices open automatically.
- **Global choice columns no longer block deploy** — a "Choice (global)" column with nothing selected is now resolved automatically instead of failing validation. The column is matched against the global choices already set up in the tool, and one is created and referenced during deployment when no match exists. Resolution runs on the Review step and again during deployment.
- **Fields step layout** — the column grid fills the available height with sticky headers and its own scroll area, instead of a fixed-height box.
- Build/tooling: removed the deprecated `baseUrl` from `tsconfig.json` and updated `finalize-package` for npm 12, where shrinkwrap generation changed.

### 1.1.0

- Added many new column types to the Fields grid:
  - **Autonumber** — text column with a configurable `AutoNumberFormat` (e.g. `INV-{SEQNUM:5}`) and maximum length.
  - **Big whole number** (`BigInt`) and **floating point** (`Double`) numeric types.
  - **Multi-select choice** — reuses the local choice option editor.
  - **File** and **Image** — with a configurable maximum size (KB) validated against documented limits.
  - **Choice (global)** — bind columns to project-level global choices.
- Added a **Global choices manager** (Fields step) to create shared global option sets. They are created before columns during deploy, reused if they already exist, and reported in the review summary.
- Extended the **column schema JSON** import/export to cover the new types (file/image size, autonumber format, and global choice by name).
- Shrunk the "Not yet supported" note to the remaining deferred types (Customer/polymorphic lookup, calculated, rollup, and form layouts & views).

### 1.0.4

- Fixed deploy aborting on 1:N lookups when the ToolBox host omits the `OData-EntityId` response header after a successful `createRelationship` (same recovery pattern already used for tables and columns).
- Lookups that already exist are skipped on retry so a partial deploy can finish and publish.

### 1.0.3

- Added **column schema JSON** on the Fields step header:
  - **Export schema** — download the active table's columns as JSON (types, attributes, and a `supportedTypes` reference catalog).
  - **Download sample schema file** — save a ready-made template with example columns.
  - **Copy sample schema** — copy the same template to the clipboard for quick editing.
  - **Paste columns via template** — upload a `.json` file or paste JSON in a modal; columns are merged by schema name (update matches, add new, keep unmatched existing).

- Import validates JSON structure, column types, naming rules, Dataverse bounds, and choice options before applying.

- Removed the tab/comma text paste flow from the column toolbar.

### 1.0.2

- Added an info notice on the Fields step listing column types not yet supported (file, image, autonumber, multi-select choice, global choice sets, calculated/rollup columns, form layouts).

- Enforced Dataverse bounds for maximum length, numeric min/max, and decimal precision in the Configure panel and pre-deploy validation.

- Redesigned local choice column configuration with Choice / Choice value columns and bulk paste support.

### 1.0.1

- Initial npm publish and ToolBox packaging fixes.

### 1.0.0

- Initial release: solution/table/column/lookup design and deployment workflow.

## License

[MIT License](https://github.com/LucasHahne/PPTB_Solution_Creator/blob/main/LICENSE)
