# Solution Creator

A [Power Platform ToolBox](https://docs.powerplatformtoolbox.com/tool-development) tool that lets you design and deploy Dataverse schema much faster than the maker portal. Create a new solution (or target an existing one), add tables, bulk-define columns of every common type, wire up 1:N lookups and M:N relationships (via auto-managed bridge tables), review, and deploy — all from a single guided workflow.

Install from npm: [`@lucas001-yt/pptb-solution-creator`](https://www.npmjs.com/package/@lucas001-yt/pptb-solution-creator)

## Features

- **Create or reuse solutions** — spin up a brand-new publisher and solution, or add to an existing unmanaged one.

- **Fast table design** — add multiple custom tables with ownership, notes, and activities settings.

- **Spreadsheet-style column builder** — inline editing, per-type sensible defaults, duplicate rows, and "add 5".

- **Column schema JSON** — export the active table's columns as JSON, download or copy a sample template (with a full type reference), and import via file upload or paste with validation and merge-by-schema-name.

- **Every creatable column type** — single/multi-line text, email, URL, phone, autonumber, whole number, big whole number, decimal, floating point, currency, date, date & time, yes/no, local choice, multi-select choice, global choice, file, and image.

- **Column bounds validation** — maximum length, numeric range, precision, and file/image size are enforced against Dataverse limits before deploy.

- **Choice option editor** — configure local and multi-select choice columns with Choice / Choice value pairs and bulk paste (`Active:1, Inactive:2`).

- **Global choices** — define shared option sets once in the Global choices manager, then bind any number of "Choice (global)" columns to them; created before columns and reused on retry.

- **Autonumber columns** — configure the format (e.g. `INV-{SEQNUM:5}`) and maximum length.

- **1:N lookups** — relate tables (project tables or standard tables like Account/Contact) with cascade configuration.

- **M:N via bridge tables** — model many-to-many relationships as an auto-managed bridge table (named `BRIDGE_Table1_Table2` by default) with a lookup to each side. The bridge is a real table, so you can add your own columns to it.

- **Review & deploy** — validation summary, ordered deployment, a live progress log, and a single publish at the end.

- **Draft autosave** — work is persisted via the ToolBox settings API and restored when you reopen the tool.

## Workflow

1. **Solution** — choose new or existing, configure the publisher prefix.

2. **Tables** — add custom tables and their primary name column.

3. **Fields** — define columns per table, or bulk-import from a validated JSON schema.

4. **Relationships** — add 1:N lookups and M:N (many-to-many) relationships.

5. **Review & Deploy** — confirm and push to Dataverse.

## Requirements

- [Power Platform ToolBox](https://docs.powerplatformtoolbox.com/) with an **active Dataverse connection** to the target environment.

- ToolBox API **1.0.20+** (declared via `features.minAPI`) for the metadata create operations.

- The connected user needs the **System Customizer** (or System Administrator) role to create publishers, solutions, tables, columns, and relationships.

## Update history

### 1.2.0

- Added **many-to-many (M:N) relationships** on the Relationships step. Each M:N is modelled as an auto-managed **bridge table** (named `BRIDGE_Table1_Table2` by default) with one 1:N lookup to each side, deployed through the normal table/column/relationship pipeline.
- The bridge is a real project table, so it appears in the Tables and Fields steps and can hold your own extra columns (unlike a native Dataverse N:N intersect).
- Bridge tables use an **autonumber primary name** column (e.g. `BRIDGE-{SEQNUM:6}`) by default; the format is editable in the field Configure panel.
- Table schema names can now contain **underscores** (needed for the `BRIDGE_` convention), with the bridge logical name kept within Dataverse's length limits.
- Bridge side lookups default to a cascading delete so link rows disappear with their parents; if the platform rejects the cascade configuration, deploy automatically retries that lookup with Remove link and logs a warning.
- Renamed the "Lookups" step to "Relationships" (now split into 1:N lookups and M:N via bridge table).

### 1.1.0

- Added new column types to the Fields grid:
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
