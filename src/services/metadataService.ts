/**
 * Thin wrappers around the Dataverse metadata API that always thread the target
 * solution's unique name through MetadataOperationOptions.
 */

function options(solutionUniqueName: string) {
  return { solutionUniqueName };
}

/**
 * The host's create* metadata APIs read the new MetadataId from the OData-EntityId
 * response header. On some environments that header is absent even though the
 * metadata was created successfully, surfacing as this error. When we see it we
 * recover by looking the record up by name.
 */
function isMissingEntityIdHeaderError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /MetadataId/i.test(message) && /OData-EntityId/i.test(message);
}

/**
 * Dataverse rejects a relationship whose NavigationPropertyName already exists
 * (error 0x80072551). This happens when a previous create actually succeeded but
 * the host reported failure (see isMissingEntityIdHeaderError), so a retry tries
 * to create it again. Treat it as "already created" and recover by lookup.
 */
function isNavigationPropertyNotUniqueError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /0x80072551/i.test(message) ||
    (/NavigationPropertyName/i.test(message) && /not unique/i.test(message))
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

/** Match a relationship SchemaName in a listing response, returning its id or null. */
function matchRelationshipId(
  list: { value: Record<string, unknown>[] },
  relationshipSchemaName: string,
): string | null {
  const target = relationshipSchemaName.toLowerCase();
  const match = list.value.find(
    (rel) =>
      typeof rel.SchemaName === 'string' &&
      rel.SchemaName.toLowerCase() === target,
  );
  const id = match?.MetadataId;
  return typeof id === 'string' ? id : null;
}

/**
 * Look up an existing 1:N relationship's MetadataId by SchemaName. Tries, in
 * order: the keyed path on the parent (referenced) entity, listing the parent's
 * OneToManyRelationships, and — when the child (referencing) entity is known —
 * listing its ManyToOneRelationships. The child listing is far smaller and more
 * reliable than scanning a busy standard entity like systemuser. Returns null
 * only when every strategy comes up empty.
 */
export async function findRelationshipMetadataId(
  parentLogicalName: string,
  relationshipSchemaName: string,
  childLogicalName?: string,
): Promise<string | null> {
  // 1. Keyed lookup on the parent.
  try {
    const response = await window.dataverseAPI.getEntityRelatedMetadata(
      parentLogicalName,
      `OneToManyRelationships(SchemaName='${relationshipSchemaName}')`,
      ['SchemaName', 'MetadataId'],
    );
    const id = (response as Record<string, unknown>).MetadataId;
    if (typeof id === 'string') return id;
    // Keyed call succeeded but carried no id — fall through to listing.
  } catch {
    // Keyed path can fail on some hosts; fall through to listing.
  }

  // 2. List the parent's 1:N relationships and match by SchemaName.
  try {
    const list = await window.dataverseAPI.getEntityRelatedMetadata(
      parentLogicalName,
      'OneToManyRelationships',
      ['SchemaName', 'MetadataId'],
    );
    const id = matchRelationshipId(list, relationshipSchemaName);
    if (id) return id;
  } catch {
    // Ignore and try the child side.
  }

  // 3. List the child's N:1 relationships (small, reliable) and match.
  if (childLogicalName) {
    try {
      const list = await window.dataverseAPI.getEntityRelatedMetadata(
        childLogicalName,
        'ManyToOneRelationships',
        ['SchemaName', 'MetadataId'],
      );
      const id = matchRelationshipId(list, relationshipSchemaName);
      if (id) return id;
    } catch {
      // Give up below.
    }
  }

  return null;
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

/** A global option set that already exists in the connected environment. */
export interface GlobalOptionSetSummary {
  /** Lowercased Name, i.e. the prefixed identity used for collision checks. */
  name: string;
  displayName: string;
  metadataId: string;
}

/** Read the first localized label off a Dataverse label object, if present. */
function localizedLabel(value: unknown): string | undefined {
  const labels = (value as { LocalizedLabels?: Array<{ Label?: unknown }> })
    ?.LocalizedLabels;
  const label = labels?.[0]?.Label;
  return typeof label === 'string' ? label : undefined;
}

/**
 * List the global option sets that already exist in the environment. Used both
 * for deploy-time reuse and to stop the tool from defining a global choice whose
 * name is already taken.
 */
export async function listGlobalOptionSets(): Promise<GlobalOptionSetSummary[]> {
  const response = await window.dataverseAPI.queryData(
    'GlobalOptionSetDefinitions?$select=Name,MetadataId,DisplayName',
  );
  const summaries: GlobalOptionSetSummary[] = [];
  for (const row of response.value) {
    const name = row.Name;
    const metadataId = row.MetadataId;
    if (typeof name !== 'string' || typeof metadataId !== 'string') continue;
    summaries.push({
      name: name.toLowerCase(),
      displayName: localizedLabel(row.DisplayName) ?? name,
      metadataId,
    });
  }
  return summaries;
}

/** Look up an existing global option set's MetadataId by Name, or null if absent. */
export async function findGlobalOptionSetMetadataId(
  name: string,
): Promise<string | null> {
  const target = name.toLowerCase();
  try {
    const all = await listGlobalOptionSets();
    return all.find((o) => o.name === target)?.metadataId ?? null;
  } catch {
    return null;
  }
}

export async function createGlobalOptionSet(
  definition: Record<string, unknown>,
  solutionUniqueName: string,
  name?: string,
): Promise<string> {
  try {
    const result = await window.dataverseAPI.createGlobalOptionSet(
      definition,
      options(solutionUniqueName),
    );
    return result.id;
  } catch (error) {
    if (name && isMissingEntityIdHeaderError(error)) {
      const recoveredId = await findGlobalOptionSetMetadataId(name);
      if (recoveredId) return recoveredId;
    }
    throw error;
  }
}

export async function createOneToMany(
  definition: Record<string, unknown>,
  solutionUniqueName: string,
  parentLogicalName?: string,
  relationshipSchemaName?: string,
  childLogicalName?: string,
): Promise<string> {
  try {
    const result = await window.dataverseAPI.createRelationship(
      definition,
      options(solutionUniqueName),
    );
    return result.id;
  } catch (error) {
    // Both of these errors mean the relationship almost certainly landed in
    // Dataverse even though the create call reported failure: the host dropped
    // the OData-EntityId header, or a prior create already succeeded and this
    // retry hit a NavigationPropertyName uniqueness clash. Recover by lookup.
    const recoverable =
      isMissingEntityIdHeaderError(error) ||
      isNavigationPropertyNotUniqueError(error);
    if (parentLogicalName && relationshipSchemaName && recoverable) {
      let recoveredId = await findRelationshipMetadataId(
        parentLogicalName,
        relationshipSchemaName,
        childLogicalName,
      );
      // Metadata can lag immediately after a create; give it one short retry.
      if (!recoveredId) {
        await delay(1500);
        recoveredId = await findRelationshipMetadataId(
          parentLogicalName,
          relationshipSchemaName,
          childLogicalName,
        );
      }
      if (recoveredId) return recoveredId;
    }
    throw error;
  }
}

export async function publishAll(): Promise<void> {
  await window.dataverseAPI.publishCustomizations();
}
