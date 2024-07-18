import { Model } from './Model';
import { Attribute, Relationship, Entity, NormalizedData } from './interfaces';

/**
 * Normalizes the given data.
 * @param entity The entity name.
 * @param data The data to normalize.
 * @returns The normalized data.
 */
export function normalizeData(
  entity: string,
  data: Entity | Entity[],
): NormalizedData {
  const result: NormalizedData = {};
  result[entity] = {};

  if (Array.isArray(data)) {
    data.forEach((item) => {
      result[entity][item.id] = { ...item, $id: item.id.toString() };
    });
  } else {
    result[entity][data.id] = { ...data, $id: data.id.toString() };
  }
  return result;
}

/**
 * Creates records from the normalized data.
 * @param normalizedData The normalized data.
 * @param model The model class.
 * @returns The created records.
 */
export function createRecords(
  normalizedData: NormalizedData,
  model: typeof Model,
) {
  const entity: string = model.entity;
  if (!normalizedData[entity]) {
    throw new Error(`No data found for type: ${model.entity}`);
  }

  const records = Object.values(normalizedData[entity]).map(
    (record) => new model(record),
  );
  return { [entity]: records };
}

/**
 * Checks if a field is an attribute.
 * @param field The field to check.
 * @returns True if the field is an attribute, false otherwise.
 */
export function isAttribute(
  field: Attribute | Relationship,
): field is Attribute {
  return (field as Attribute).make !== undefined;
}

/**
 * Checks if a field is a relationship.
 * @param field The field to check.
 * @returns True if the field is a relationship, false otherwise.
 */
export function isRelationship(
  field: Attribute | Relationship,
): field is Relationship {
  return (field as Relationship).type !== undefined;
}
