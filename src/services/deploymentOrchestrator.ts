import type { DeploymentStatus, LogLevel, SolutionProject } from '../types/project';
import { buildEntityDefinition, getPrimaryNameField } from '../builders/entityBuilder';
import { buildAttributeDefinition } from '../builders/fieldBuilder';
import { buildOneToManyRelationship } from '../builders/relationshipBuilder';
import {
  createColumn,
  createOneToMany,
  createTable,
  findEntityMetadataId,
  listColumnLogicalNames,
  publishAll,
} from './metadataService';
import { createPublisher, findPublisher } from './publisherService';
import { createSolution, findSolutionByUniqueName } from './solutionService';
import { resolveRelationship, tableLogicalName } from './projectResolver';
import { buildLogicalName } from './namingService';
import { getProjectPrefix } from './validationService';
import { toErrorMessage } from '../utils/errors';

export type DeploymentLogger = (level: LogLevel, message: string) => void;

/**
 * Verify a payload survives a structured clone before it crosses the iframe/host
 * postMessage boundary. If it doesn't, throw a descriptive error (and log the raw
 * payload to the console) so the offending definition is obvious instead of the
 * opaque "An object could not be cloned" message.
 */
function assertCloneable(label: string, payload: unknown): void {
  try {
    structuredClone(payload);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[Solution Creator] ${label} is not structured-clone-safe:`, payload, error);
    throw new Error(
      `The ${label} payload contains a value that cannot be sent to Dataverse. ` +
        'Check the browser console for the offending object.',
    );
  }
}

export interface DeploymentResult {
  status: Exclude<DeploymentStatus, 'idle' | 'running'>;
  createdTables: number;
  createdColumns: number;
  createdRelationships: number;
}

/**
 * Sequence the full deployment:
 *   publisher -> solution -> tables -> columns -> relationships -> publish.
 *
 * On the first failure it stops, logs what succeeded, and returns a partial/error
 * result. There is no automatic rollback (Dataverse does not support it here).
 */
export async function deployProject(
  project: SolutionProject,
  log: DeploymentLogger,
): Promise<DeploymentResult> {
  const result: DeploymentResult = {
    status: 'success',
    createdTables: 0,
    createdColumns: 0,
    createdRelationships: 0,
  };

  const prefix = getProjectPrefix(project);
  if (!prefix) {
    log('error', 'Could not resolve the publisher prefix. Deployment aborted.');
    return { ...result, status: 'error' };
  }

  // Resolve / create the target solution unique name.
  let solutionUniqueName: string;
  try {
    solutionUniqueName = await ensureSolution(project, log);
  } catch (error) {
    log('error', `Failed to prepare the solution: ${toErrorMessage(error)}`);
    return { ...result, status: 'error' };
  }

  try {
    // Tables (primary name column is embedded). Skip tables that already exist so
    // retries after a partial deployment are safe.
    for (const entity of project.tables) {
      const logicalName = tableLogicalName(prefix, entity);
      const existingId = await findEntityMetadataId(logicalName);
      if (existingId) {
        log('info', `Table "${entity.displayName}" already exists — reusing it.`);
        continue;
      }
      const definition = buildEntityDefinition(prefix, entity);
      assertCloneable(`table "${entity.displayName}"`, definition);
      await createTable(definition, solutionUniqueName, logicalName);
      result.createdTables += 1;
      log('success', `Created table "${entity.displayName}".`);
    }

    // Columns (everything except the primary name column and lookups). Skip columns
    // that already exist on the table.
    for (const entity of project.tables) {
      const logicalName = tableLogicalName(prefix, entity);
      const primary = getPrimaryNameField(entity);
      const columns = entity.fields.filter(
        (f) => f.id !== primary?.id && f.type !== 'lookup',
      );
      const existingColumns = await listColumnLogicalNames(logicalName);
      for (const field of columns) {
        const columnLogicalName = buildLogicalName(prefix, field.schemaName);
        if (existingColumns.has(columnLogicalName)) {
          log('info', `Column "${field.displayName}" already exists on "${entity.displayName}" — skipping.`);
          continue;
        }
        const definition = buildAttributeDefinition(prefix, field);
        assertCloneable(`column "${field.displayName}"`, definition);
        await createColumn(logicalName, definition, solutionUniqueName, columnLogicalName);
        result.createdColumns += 1;
        log('success', `Added column "${field.displayName}" to "${entity.displayName}".`);
      }
    }

    // Relationships (1:N lookups).
    for (const rel of project.relationships) {
      const resolved = resolveRelationship(prefix, project, rel);
      if (!resolved) {
        log('warning', `Skipped lookup "${rel.lookupDisplayName}" — could not resolve its tables.`);
        continue;
      }
      const definition = buildOneToManyRelationship(prefix, rel, resolved);
      assertCloneable(`lookup "${rel.lookupDisplayName}"`, definition);
      await createOneToMany(definition, solutionUniqueName);
      result.createdRelationships += 1;
      log('success', `Created lookup "${rel.lookupDisplayName}" (${resolved.parentLogicalName} → ${resolved.childLogicalName}).`);
    }

    // Publish everything once at the end.
    log('info', 'Publishing customizations…');
    await publishAll();
    log('success', 'Customizations published.');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Solution Creator] Deployment error:', error);
    log('error', `Deployment stopped: ${toErrorMessage(error)}`);
    const anyProgress =
      result.createdTables + result.createdColumns + result.createdRelationships > 0;
    return { ...result, status: anyProgress ? 'partial' : 'error' };
  }

  return result;
}

/** Create the publisher/solution if new, and return the solution unique name. */
async function ensureSolution(
  project: SolutionProject,
  log: DeploymentLogger,
): Promise<string> {
  const { solution } = project;

  if (solution.mode === 'existing') {
    if (!solution.existing) throw new Error('No existing solution selected.');
    log('info', `Targeting existing solution "${solution.existing.friendlyname}".`);
    return solution.existing.uniquename;
  }

  const draft = solution.draft;
  if (!draft) throw new Error('No new solution configured.');

  let publisherId = draft.existingPublisherId;
  if (!publisherId && draft.newPublisher) {
    // Reuse a matching publisher if one already exists (e.g. retry after a partial run).
    const existing = await findPublisher({
      uniqueName: draft.newPublisher.uniqueName,
      prefix: draft.newPublisher.prefix,
    });
    if (existing) {
      publisherId = existing;
      log('info', `Reusing existing publisher "${draft.newPublisher.friendlyName}".`);
    } else {
      publisherId = await createPublisher({
        friendlyName: draft.newPublisher.friendlyName,
        uniqueName: draft.newPublisher.uniqueName,
        prefix: draft.newPublisher.prefix,
      });
      log('success', `Created publisher "${draft.newPublisher.friendlyName}".`);
    }
  }
  if (!publisherId) throw new Error('No publisher available for the new solution.');

  // Reuse the solution if it already exists; otherwise create it.
  const existingSolution = await findSolutionByUniqueName(draft.uniqueName);
  if (existingSolution) {
    log('info', `Solution "${draft.friendlyName}" already exists — reusing it.`);
  } else {
    await createSolution({
      friendlyName: draft.friendlyName,
      uniqueName: draft.uniqueName,
      version: draft.version,
      publisherId,
    });
    log('success', `Created solution "${draft.friendlyName}".`);
  }

  return draft.uniqueName;
}
