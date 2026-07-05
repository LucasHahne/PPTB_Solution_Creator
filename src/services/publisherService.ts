import type { PublisherSummary } from '../types/solution';

/** List publishers, excluding the built-in Microsoft/default publishers. */
export async function listPublishers(): Promise<PublisherSummary[]> {
  const result = await window.dataverseAPI.queryData(
    'publishers?$select=publisherid,friendlyname,uniquename,customizationprefix&$orderby=friendlyname',
  );
  return result.value
    .map((row) => ({
      publisherid: String(row.publisherid),
      friendlyname: String(row.friendlyname ?? row.uniquename),
      uniquename: String(row.uniquename),
      customizationprefix: String(row.customizationprefix ?? ''),
    }))
    .filter((p) => p.customizationprefix && p.customizationprefix !== 'mscrm');
}

/**
 * Find an existing publisher by unique name or customization prefix.
 * Returns its GUID, or null if none match.
 */
export async function findPublisher(params: {
  uniqueName?: string;
  prefix?: string;
}): Promise<string | null> {
  const filters: string[] = [];
  if (params.uniqueName) filters.push(`uniquename eq '${params.uniqueName}'`);
  if (params.prefix) filters.push(`customizationprefix eq '${params.prefix}'`);
  if (filters.length === 0) return null;

  const result = await window.dataverseAPI.queryData(
    `publishers?$select=publisherid&$filter=${filters.join(' or ')}`,
  );
  const row = result.value[0];
  return row ? String(row.publisherid) : null;
}

/** Create a new publisher. Returns the new publisher's GUID. */
export async function createPublisher(params: {
  friendlyName: string;
  uniqueName: string;
  prefix: string;
}): Promise<string> {
  const result = await window.dataverseAPI.create('publisher', {
    friendlyname: params.friendlyName,
    uniquename: params.uniqueName,
    customizationprefix: params.prefix,
  });
  return result.id;
}

/** Resolve the customization prefix for an existing solution via its publisher. */
export async function getSolutionPrefix(solutionUniqueName: string): Promise<string | null> {
  const result = await window.dataverseAPI.queryData(
    `solutions?$select=uniquename&$filter=uniquename eq '${solutionUniqueName}'&$expand=publisherid($select=customizationprefix)`,
  );
  const row = result.value[0] as
    | { publisherid?: { customizationprefix?: string } }
    | undefined;
  return row?.publisherid?.customizationprefix ?? null;
}
