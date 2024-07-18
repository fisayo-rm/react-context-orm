import { State } from './ModelContext';
import { Model } from './Model';
/**
 * Interface representing an attribute of a model.
 */
export interface Attribute {
  value: any;
  make(value: any): any;
}

/**
 * Interface representing a relationship between models.
 */
export interface Relationship {
  type: string;
  relatedModel: typeof Model;
  foreignKey: string;
}

/**
 * Interface representing the fields of a model.
 */
export interface Fields {
  [key: string]: Attribute | Relationship;
}

/**
 * Interface representing a cache of fields for models.
 */
export interface FieldCache {
  [key: string]: Fields;
}

/**
 * Interface representing a record of a model.
 */
export interface ModelRecord {
  [field: string]: any;
}

/**
 * Type representing a predicate function for filtering models.
 */
export type Predicate<T> = (item: T) => boolean;

// TODO: refactor code to use this (Interface representing the state of the store.)
// export interface State {
//   [entity: string]: ModelRecord[];
// }
