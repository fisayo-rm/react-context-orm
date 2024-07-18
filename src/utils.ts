import { Attribute, Relationship } from './interfaces';

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
