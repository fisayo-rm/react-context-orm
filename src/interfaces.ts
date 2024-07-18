import { Model } from './Model';

/**
 * Interface representing an entity with an ID.
 */
export interface Entity {
  id: number | string;
  [field: string]: any;
}

/**
 * Interface representing normalized data.
 */
export interface NormalizedData {
  [key: string]: { [key: string]: Entity & { $id: string } };
}

/**
 * Interface representing the state of the store.
 */
export type State = Record<string, any>;

/**
 * Interface representing an action.
 */
export type Action = { type: string; payload?: any };

/**
 * Interface representing the context for actions.
 */
export type ActionContext = {
  state: State;
  commit: (type: string, payload?: any) => void;
  dispatch: (type: string, payload?: any) => Promise<any>;
};

/**
 * Interface representing an action creator.
 */
export type ActionCreator = (
  context: ActionContext,
  payload?: any,
) => Promise<any> | void;

/**
 * Interface representing a mutation.
 */
export type Mutation = (state: State, payload?: any) => void;

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
