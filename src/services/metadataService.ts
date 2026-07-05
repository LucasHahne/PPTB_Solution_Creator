/**
 * Thin wrappers around the Dataverse metadata API that always thread the target
 * solution's unique name through MetadataOperationOptions.
 */

function options(solutionUniqueName: string) {
  return { solutionUniqueName };
}

/**
 * The host's createEntityDefinition reads the new entity's MetadataId from the
 * OData-EntityId response header. On some environments that header is absent even
 * though the entity was created successfully, surfacing as this error. When we see
 * it we can safely recover by looking the entity up by its logical name.
 */
function isMissingEntityIdHeaderError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /MetadataId/i.test(message) && /OData-EntityId/i.test(message);
}

/** Look up an existing entity's MetadataId by logical name, or null if it doesn't exist. */
export async function findEntityMetadataId(
  entityLogicalName: string,
): Promise<string | null> {
  try {
    const meta = await window.dataverseAPI.getEntityMetadata(
      entityLogicalName,
      true,
      ['LogicalName', 'MetadataId'],
    );
    return meta?.MetadataId ?? null;
  } catch {
    return null;
  }
}

/** Look up an existing attribute's MetadataId by logical name, or null if it doesn't exist. */
export async function findAttributeMetadataId(
  entityLogicalName: string,
  attributeLogicalName: string,
): Promise<string | null> {
  try {
    const response = await window.dataverseAPI.getEntityRelatedMetadata(
      entityLogicalName,
      `Attributes(LogicalName='${attributeLogicalName}')`,
      ['LogicalName', 'MetadataId'],
    );
    const id = (response as Record<string, unknown>).MetadataId;
    return typeof id === 'string' ? id : null;
  } catch {
    return null;
  }
}

/** Return the lowercased logical names of all columns already on an entity. */
export async function listColumnLogicalNames(
  entityLogicalName: string,
): Promise<Set<string>> {
  try {
    const response = await window.dataverseAPI.getEntityRelatedMetadata(
      entityLogicalName,
      'Attributes',
      ['LogicalName'],
    );
    const names = new Set<string>();
    for (const attr of response.value) {
      const logical = attr.LogicalName;
      if (typeof logical === 'string') names.add(logical.toLowerCase());
    }
    return names;
  } catch {
    return new Set<string>();
  }
}

export async function createTable(
  definition: Record<string, unknown>,
  solutionUniqueName: string,
  entityLogicalName?: string,
): Promise<string> {
  try {
    const result = await window.dataverseAPI.createEntityDefinition(
      definition,
      options(solutionUniqueName),
    );
    return result.id;
  } catch (error) {
    if (entityLogicalName && isMissingEntityIdHeaderError(error)) {
      const recoveredId = await findEntityMetadataId(entityLogicalName);
      if (recoveredId) return recoveredId;
    }
    throw error;
  }
}

export async function createColumn(
  entityLogicalName: string,
  definition: Record<string, unknown>,
  solutionUniqueName: string,
  columnLogicalName?: string,
): Promise<string> {
  try {
    const result = await window.dataverseAPI.createAttribute(
      entityLogicalName,
      definition,
      options(solutionUniqueName),
    );
    return result.id;
  } catch (error) {
    if (columnLogicalName && isMissingEntityIdHeaderError(error)) {
      const recoveredId = await findAttributeMetadataId(
        entityLogicalName,
        columnLogicalName,
      );
      if (recoveredId) return recoveredId;
    }
    throw error;
  }
}

export async function createOneToMany(
  definition: Record<string, unknown>,
  solutionUniqueName: string,
): Promise<string> {
  const result = await window.dataverseAPI.createRelationship(
    definition,
    options(solutionUniqueName),
  );
  return result.id;
}

export async function publishAll(): Promise<void> {
  await window.dataverseAPI.publishCustomizations();
}
