# Feature: M:N relationships

**From build-plan:** feature 9
**Build attempt:** 1
**Branch:** `v.1.1.7-m-n-relationships`

## Goal

Let makers design and deploy many-to-many relationships as an explicit **bridge table** with an autonumber primary column and two lookup columns, using the naming defaults locked in `prototypes/`, without using native Dataverse N:N relationship metadata in this build.

## Design reference

- `prototypes/theme.css` - visual tokens (brand blue / slate; app already mirrors these in Tailwind `brand.*` - prefer existing Tailwind/`ui/` primitives over inventing a new `@theme` pipeline)
- `prototypes/lookups-list.html` - Lookups step with 1:N vs M:N sections and bridge list rows
- `prototypes/mn-editor.html` - create/edit M:N dialog with live defaults and schema preview
- `prototypes/bridge-schema.html` - naming and deploy-order contract

## In scope

- New draft model for M:N (separate from 1:N `LookupRelationshipDraft`)
- Lookups step UI: keep 1:N; add M:N list + add/edit/delete aligned with prototypes
- Default naming (all editable unless noted):
  - Bridge display: `Bridge {Left} {Right}`
  - Bridge schema: `Bridge{Left}{Right}` (no publisher prefix; prefix at deploy)
  - Primary: display `Bridge Number`, schema `BridgeNumber`, autonumber format `BRG-{SEQNUM:5}`
  - Left lookup: display `{Left}`, schema `Lookup{Left}`
  - Right lookup: display `{Right}`, schema `Lookup{Right}`
- Validation on the relationships step (required names, distinct sides, resolvable tables, schema tokens)
- Deploy: create bridge entity (autonumber primary) then the two 1:N lookups onto the bridge; skip if already present (same retry spirit as current 1:N)
- Review summary and draft autosave include M:N drafts
- Update copy that currently says M:N is out of scope

## Out of scope

- Native Dataverse `ManyToManyRelationshipMetadata` / intersect-without-custom-table
- Showing bridge tables as full editable rows in the Tables / Fields wizard steps
- Extra bridge columns beyond primary + two lookups
- Cascade UI for M:N (use existing 1:N-safe defaults: Delete `RemoveLink`, other cascades `NoCascade`)
- Unit/browser test harness setup (`/tests`, `/browser-tests`)
- npm publish / registry submission

## Build loop

- `workflow.stepReview`: **feature** - one review packet for the whole feature (no per-step approval pauses)
- `workflow.checkpointCommits`: **disabled**
- Final feature commit via `/complete`

## Build steps

- [x] **1. Draft model + store**
  - Add `ManyToManyRelationshipDraft` (and helpers for default display/schema from left/right labels) under `src/types/`.
  - Extend `SolutionProject` with `manyToManyRelationships` (or equivalent), normalize on load, and add Zustand CRUD mirroring 1:N.
  - **Done when:** TypeScript builds; empty projects and old drafts load without runtime errors; defaults match prototype patterns for sample left/right names.

- [x] **2. Naming helpers**
  - Centralize default generators: `Bridge {L} {R}`, `Bridge{L}{R}`, `Lookup{L}`, `Lookup{R}`, primary Bridge Number / BridgeNumber / `BRG-{SEQNUM:5}`.
  - Reuse `toPascalToken` / `sanitizeSchemaToken` from `namingService`.
  - **Done when:** Changing left/right regenerates untouched fields; user edits stick (touched flags or equivalent).

- [x] **3. Primary autonumber on create**
  - Extend entity create path so a bridge table can embed an **autonumber** primary (`AutoNumberFormat`), not only `buildPrimaryNameAttribute`'s fixed String/Text path (`fieldBuilder.ts`).
  - Keep normal user tables on the existing primary-name behavior unless a shared path is clearly safe.
  - **Done when:** `npm run build` passes; generated bridge entity payload includes `IsPrimaryName: true` and `AutoNumberFormat` (observable in unit-free inspection of the builder output / logged definition).

- [x] **4. Deploy orchestration**
  - After project tables/columns and alongside or after 1:N relationships, deploy each M:N: bridge table → left lookup → right lookup (order from `bridge-schema.html`).
  - Resolve left/right logical names like existing 1:N resolution; skip creates when relationship/column already exists.
  - Bridge ownership: `OrganizationOwned`; notes/activities off unless evidence requires otherwise.
  - **Done when:** Dry inspection of orchestrator order matches the contract; ToolBox deploy of a two-table M:N succeeds or fails with a clear log line (manual check in ToolBox Debug).

- [x] **5. Validation + review**
  - Validate M:N drafts on the relationships step; surface issues in Review.
  - **Done when:** Missing names, same left/right, invalid schema tokens, or missing tables produce errors; Review lists M:N bridge rows.

- [x] **6. Lookups UI**
  - Update `RelationshipsStep` / list / new M:N editor per prototypes (tabs or clear 1:N vs M:N sections; schema preview).
  - Left/right pickers: project tables required for v1; optionally reuse catalog/combobox patterns from `RelationshipEditor` if both sides should allow standard tables - **choose project-tables-only if catalog wiring balloons this step**.
  - Remove "M:N out of scope" alerts; keep empty/loading/disabled states when no tables.
  - **Done when:** UI matches prototype contracts in light and dark (ToolBox theme class); add/edit/delete M:N works in the running tool.

- [x] **7. Build gate**
  - Run `npm run build`.
  - **Done when:** Build is green; no new Verify/test claims beyond that.

**Status:** verified

## Files / areas

- `src/types/relationship.ts` (or new `manyToMany.ts`) + `src/types/project.ts`
- `src/store/projectStore.ts`
- `src/services/namingService.ts` (or small helper next to relationships)
- `src/builders/fieldBuilder.ts`, `entityBuilder.ts`, `relationshipBuilder.ts`
- `src/services/deploymentOrchestrator.ts`, `validationService.ts`, `projectResolver.ts` (if resolution helpers live there)
- `src/components/relationships/*`, `src/components/deploy/ReviewSummary.tsx`
- Design reference only: `prototypes/*` (do not delete until `/complete`)

## Data / contracts

### ManyToManyRelationshipDraft (persist in settings draft)

| Field | Type / rule |
|-------|-------------|
| `id` | string |
| `left` / `right` | refs to two distinct tables (v1: project table ids; document if standard refs are added) |
| `bridgeDisplayName` | string, default `Bridge {Left} {Right}` |
| `bridgeSchemaName` | schema token without prefix, default `Bridge{Left}{Right}` |
| `primaryDisplayName` | default `Bridge Number` |
| `primarySchemaName` | default `BridgeNumber` |
| `autoNumberFormat` | default `BRG-{SEQNUM:5}` |
| `leftLookupDisplayName` / `leftLookupSchemaName` | default `{Left}` / `Lookup{Left}` |
| `rightLookupDisplayName` / `rightLookupSchemaName` | default `{Right}` / `Lookup{Right}` |

Logical names at deploy: `buildSchemaName(prefix, …)` / existing logical-name helpers.

### Deploy order

1. Left and right tables already exist (earlier in the same run or environment).
2. Create bridge entity with autonumber primary.
3. Create lookup bridge → left, then bridge → right (1:N metadata via existing relationship create API).
4. Share final publish with the rest of the solution.

### Errors / UX states

- Happy: M:N listed; deploy log success per bridge/lookups
- Empty: no M:N yet (prompt to add)
- Invalid: validation blocks Review/Deploy with relationships-step issues
- Deploy skip: already-exists paths log info like 1:N
- Unexpected: API failures surface in deployment log; no silent swallow

## Testing

- No `test` or Browser tests command in `AGENTS.md` - no automated test gate for this feature.
- Checks: `npm run build`; manual ToolBox Debug deploy of one M:N between two project tables; visual check of Lookups UI vs prototypes (light/dark).

## Notes for the AI

- Do not invent native N:N API usage; explicit bridge is the product contract.
- Preserve 1:N behavior and drafts.
- `buildPrimaryNameAttribute` today forces String/Text - bridge create must not silently deploy a Name text primary.
- Prefer extending builders/orchestrator over duplicating Web API call sites.
- Feature review is once at the end (`stepReview: feature`); keep steps green via `npm run build` as you go.

## Open questions

None blocking. Deferred product choices (native N:N later; editable cascade for bridge lookups; standard-table sides) stay out of this attempt unless implementation naturally reuses 1:N parent refs without extra scope.
