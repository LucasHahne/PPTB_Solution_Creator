# Solution Creator

A [Power Platform ToolBox](https://docs.powerplatformtoolbox.com/tool-development) tool that lets you design and deploy Dataverse schema much faster than the maker portal. Create a new solution (or target an existing one), add tables, bulk-define columns of every common type, wire up 1:N lookups, review, and deploy — all from a single guided workflow.

## Features

- **Create or reuse solutions** — spin up a brand-new publisher and solution, or add to an existing unmanaged one.
- **Fast table design** — add multiple custom tables with ownership, notes, and activities settings.
- **Spreadsheet-style column builder** — inline editing, per-type sensible defaults, duplicate rows, "add 5", and paste-from-clipboard bulk entry.
- **All common column types** — single/multi-line text, email, URL, phone, whole number, decimal, currency, date, date & time, yes/no, and local choice.
- **1:N lookups** — relate tables (project tables or standard tables like Account/Contact) with cascade configuration.
- **Review & deploy** — validation summary, ordered deployment, a live progress log, and a single publish at the end.
- **Draft autosave** — work is persisted via the ToolBox settings API and restored when you reopen the tool.

## Workflow

1. **Solution** — choose new or existing, configure the publisher prefix.
2. **Tables** — add custom tables and their primary name column.
3. **Fields** — define columns per table.
4. **Lookups** — add 1:N relationships.
5. **Review & Deploy** — confirm and push to Dataverse.

> Many-to-many relationships are out of scope; Dataverse requires a bridge table for those.

## Requirements

- [Power Platform ToolBox](https://docs.powerplatformtoolbox.com/) with an **active Dataverse connection** to the target environment.
- ToolBox API **1.0.20+** (declared via `features.minAPI`) for the metadata create operations.
- The connected user needs the **System Customizer** (or System Administrator) role to create publishers, solutions, tables, columns, and relationships.

## License

[MIT License](https://github.com/LucasHahne/PPTB_Solution_Creator/blob/main/LICENSE)
