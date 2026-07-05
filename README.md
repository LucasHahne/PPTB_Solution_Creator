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

## Development

This tool is built with React, TypeScript, and Tailwind CSS, and bundled with Vite as a single IIFE for the ToolBox sandboxed iframe.

```bash
npm install
npm run build      # type-check + production build into dist/
npm run watch      # rebuild on change while developing
```

### Testing in ToolBox

1. Run `npm run watch`.
2. In Power Platform ToolBox: Settings → enable **Show Debug Menu** → Save.
3. Go to the Debug section → **Load Local Tool** → select this project's root folder.
4. After changes, close and reopen the tool tab to pick them up.

> The `window.toolboxAPI` and `window.dataverseAPI` globals only exist inside ToolBox, so `npm run dev` in a plain browser will not have live API access.

## Requirements

- ToolBox API **1.0.20+** (declared via `features.minAPI`) for the metadata create operations.
- The connected user needs the **System Customizer** (or System Administrator) role to create publishers, solutions, tables, columns, and relationships.

## Publishing

```bash
npm run build
npm run finalize-package   # generates npm-shrinkwrap.json
npm publish --access public
```

Then submit the package to the ToolBox registry. See the [publishing guide](https://docs.powerplatformtoolbox.com/tool-development) for details.

## License

MIT
