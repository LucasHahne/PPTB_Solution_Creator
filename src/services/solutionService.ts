import type { SolutionSummary } from '../types/solution';

const SOLUTION_COLUMNS = [
  'solutionid',
  'uniquename',
  'friendlyname',
  'version',
  'ismanaged',
];

/** List unmanaged solutions in the environment, excluding system/default ones. */
export async function listSolutions(): Promise<SolutionSummary[]> {
  const result = await window.dataverseAPI.getSolutions(SOLUTION_COLUMNS);
  return result.value
    .map((row) => ({
      solutionid: String(row.solutionid),
      uniquename: String(row.uniquename),
      friendlyname: String(row.friendlyname ?? row.uniquename),
      version: String(row.version ?? ''),
      ismanaged: Boolean(row.ismanaged),
    }))
    .filter((s) => !s.ismanaged)
    .filter((s) => s.uniquename !== 'Default' && s.uniquename !== 'Active')
    .sort((a, b) => a.friendlyname.localeCompare(b.friendlyname));
}

/** Find a solution by unique name. Returns its GUID, or null if not found. */
export async function findSolutionByUniqueName(uniqueName: string): Promise<string | null> {
  const result = await window.dataverseAPI.queryData(
    `solutions?$select=solutionid,uniquename&$filter=uniquename eq '${uniqueName}'`,
  );
  const row = result.value[0];
  return row ? String(row.solutionid) : null;
}

/**
 * Create a new unmanaged solution bound to the given publisher.
 * Returns the new solution's GUID.
 */
export async function createSolution(params: {
  friendlyName: string;
  uniqueName: string;
  version: string;
  publisherId: string;
}): Promise<string> {
  const result = await window.dataverseAPI.create('solution', {
    friendlyname: params.friendlyName,
    uniquename: params.uniqueName,
    version: params.version || '1.0.0.0',
    'publisherid@odata.bind': `/publishers(${params.publisherId})`,
  });
  return result.id;
}
