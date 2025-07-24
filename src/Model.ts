import { State } from './interfaces';
import { QueryBuilder } from './QueryBuilder';
import {
  FieldCache,
  Attribute,
  Fields,
  ModelRecord,
  Relationship,
  Predicate,
} from './interfaces';
import { isAttribute, isRelationship } from './utils';

/**
 * Base class for models in the ORM.
 */
export class Model {
  [key: string]: any;

  /**
   * The entity name of the model.
   */
  static entity: string;

  /**
   * Cached fields for the model.
   */
  static cachedFields: FieldCache;

  /**
   * The primary key of the model instance.
   */
  $id: string | null = null;

  /**
   * The dispatch function for dispatching actions.
   */
  static dispatch: (type: string, payload?: any) => Promise<any>;

  /**
   * The state of the store.
   */
  static store: State;

  /**
   * Initializes the model with the given state and dispatch function.
   * @param state The state of the store.
   * @param dispatch The dispatch function.
   */
  static async init(
    state: State,
    dispatch: (type: string, payload?: any) => Promise<any>,
  ) {
    this.dispatch = dispatch;

    if (state && JSON.stringify(state) !== JSON.stringify(Model.store)) {
      await dispatch('hydrate', state);
    } else {
      Model.store = state;
    }
  }

  /**
   * Creates a new instance of the model.
   * @param record The record to initialize the model with.
   */
  constructor(record?: ModelRecord) {
    this.$fill(record);
    this.$loadRelated();
    // this.$defineGettersAndSetters();
  }

  /**
   * Returns the fields of the model.
   * @returns The fields of the model.
   */
  static fields(): Fields {
    return {};
  }

  /**
   * Creates an attribute with the given default value.
   * @param defaultValue The default value of the attribute.
   * @returns The attribute.
   */
  static attr(defaultValue: any): Attribute {
    const value = defaultValue;
    return {
      value,
      make(value: any): any {
        let localValue = value !== undefined ? value : defaultValue;
        if (typeof value === 'function') {
          localValue = value();
        }
        return localValue;
      },
    };
  }

  /**
   * Returns the cached fields of the model.
   * @returns The cached fields of the model.
   */
  static getFields(): Fields {
    this.cachedFields ??= {};
    this.cachedFields[this.entity] ??= this.fields();

    return this.cachedFields[this.entity];
  }

  /**
   * Returns the constructor of the model.
   * @returns The constructor of the model.
   */
  $self(): typeof Model {
    return this.constructor as typeof Model;
  }

  /**
   * Returns the fields of the model instance.
   * @returns The fields of the model instance.
   */
  $fields(): Fields {
    return this.$self().getFields();
  }

  /**
   * Fills the model instance with the given record.
   * @param record The record to fill the model with.
   */
  $fill(record: ModelRecord = {}): void {
    const fields = this.$fields();

    for (const key in fields) {
      const field = fields[key];
      if (isAttribute(field)) {
        const value = record[key];
        this[key] = field.make(value);
      }
    }

    record.$id !== undefined && this.$setIndex(record.$id);
  }

  /**
   * Sets the index of the model instance.
   * @param id The index to set.
   * @returns The model instance.
   */
  $setIndex(id: string | null): this {
    this.$id = id;
    return this;
  }

  /**
   * Loads the related models for the model instance.
   */
  $loadRelated(): void {
    const fields = this.$fields();

    for (const key in fields) {
      const field = fields[key];
      if (isRelationship(field) && !this.hasOwnProperty(key)) {
        Object.defineProperty(this, key, {
          get: () => {
            if (field.type === 'belongsTo') {
              const foreignKeyValue = this[field.foreignKey];
              return field.relatedModel.find(foreignKeyValue);
            } else if (field.type === 'hasMany') {
              return field.relatedModel
                .all()
                .filter((item: Model) => item[field.foreignKey] == this.$id);
            }
            return null;
          },
          enumerable: true,
        });
      }
    }
  }

  /**
   * Converts the model instance to an object.
   * @returns The object representation of the model instance.
   */

  toObject(): ModelRecord {
    // NOTE: Specifically added to prevent circular references when handling serialization
    const record: ModelRecord = {};
    const fields = this.$fields();

    for (const key in fields) {
      if (isAttribute(fields[key])) {
        record[key] = this[key];
      }
    }
    return record;
  }

  /**
   * Defines getters and setters for the model instance.
   */
  $defineGettersAndSetters(): void {
    const prototype = Object.getPrototypeOf(this);

    Object.getOwnPropertyNames(prototype).forEach((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
      if (key !== 'constructor' && typeof descriptor?.get === 'function') {
        Object.defineProperty(this, key, {
          get: descriptor.get,
          set: descriptor.get,
          enumerable: true,
        });
      }
    });
  }

  // $defineGettersAndSetters(): void {
  //   const prototype = Object.getPrototypeOf(this);

  //   [
  //     ...Object.getOwnPropertyNames(prototype),
  //     ...Object.getOwnPropertyNames(this),
  //   ].forEach((key) => {
  //     const descriptor =
  //       Object.getOwnPropertyDescriptor(this, key) ||
  //       Object.getOwnPropertyDescriptor(prototype, key);
  //     console.log('descriptor', descriptor);
  //     if (key !== 'constructor') {
  //       if (descriptor && typeof descriptor.get === 'function') {
  //         Object.defineProperty(this, key, {
  //           get: descriptor.get,
  //           set: () => {},
  //           enumerable: true,
  //         });
  //       } else {
  //         Object.defineProperty(this, key, {
  //           get: () => this[key],
  //           set: () => {},
  //           enumerable: true,
  //         });
  //       }
  //     }
  //   });
  // }

  /**
   * Creates a new record in the store.
   * @param payload The payload containing the data to create.
   * @returns The created record.
   */
  static create<T extends typeof Model>(this: T, payload: any): any {
    payload.model = this;
    return this.dispatch('create', payload);
  }

  /**
   * Inserts a new record in the store.
   * @param payload The payload containing the data to insert.
   * @returns The inserted record.
   */
  static insert<T extends typeof Model>(this: T, payload: any): any {
    payload.model = this;
    return this.dispatch('insert', payload);
  }

  /**
   * Updates an existing record in the store.
   * @param payload The payload containing the data to update.
   * @returns The updated record.
   */
  static update<T extends typeof Model>(this: T, payload: any): any {
    payload.model = this;
    return this.dispatch('update', payload);
  }

  /**
   * Inserts or updates records or a record in the store.
   * @param payload The payload containing the data to insert or update.
   * @returns The inserted or updated record(s).
   */
  static insertOrUpdate<T extends typeof Model>(this: T, payload: any): any {
    payload.model = this;
    return this.dispatch('insertOrUpdate', payload);
  }

  /**
   * Deletes records from the store based on the given id(s) or predicate.
   * @param id The id(s) or predicate to delete the records.
   * @returns The deleted records.
   */
  static delete<T extends typeof Model>(
    this: T,
    id: string | number | (number | string)[],
  ): any[];
  static delete<T extends typeof Model>(
    this: T,
    predicate: Predicate<InstanceType<T>>,
  ): any[];
  static delete<T extends typeof Model>(this: T, arg: any): any {
    const payload = { arg, model: this };
    return this.dispatch('delete', payload);
  }

  /**
   * Deletes all records of the model from the store.
   * @returns A promise that resolves when the records are deleted.
   */
  static deleteAll<T extends typeof Model>(this: T): Promise<void> {
    const payload = { model: this };
    return this.dispatch('deleteAll', payload);
  }

  /**
   * Returns all records of the model from the store.
   * @returns All records of the model.
   */
  static all<T extends typeof Model>(this: T): InstanceType<T>[] {
    return Model.store[this.entity] || [];
  }

  /**
   * Resets the state of the store.
   * @returns A promise that resolves when the state is reset.
   */
  static async reset(): Promise<any> {
    return this.dispatch('reset');
  }

  /**
   * Defines a belongsTo relationship.
   * @param relatedModel The related model.
   * @param foreignKey The foreign key.
   * @returns The relationship.
   */
  static belongsTo(
    relatedModel: typeof Model,
    foreignKey: string,
  ): Relationship {
    return { type: 'belongsTo', relatedModel, foreignKey };
  }

  /**
   * Defines a hasMany relationship.
   * @param relatedModel The related model.
   * @param foreignKey The foreign key.
   * @returns The relationship.
   */
  static hasMany(relatedModel: typeof Model, foreignKey: string): Relationship {
    return { type: 'hasMany', relatedModel, foreignKey };
  }

  /**
   * Finds a record by its id.
   * @param id The id of the record.
   * @returns The found record or undefined.
   */
  static find<T extends typeof Model>(
    this: T,
    id: string | number,
  ): InstanceType<T> | undefined {
    return (
      Model.store[this.entity]?.find((item: Model) => item.id == id) || null
    );
  }

  /**
   * Creates a query builder for the model.
   * @returns The query builder.
   */
  static query<T extends typeof Model>(this: T): QueryBuilder<T> {
    return new QueryBuilder(this);
  }

  /**
   * Hydrates the store with the given state
   * @param state The external data to hydrate with
   * @returns A promise that resolves when hydration is complete
   */
  static async hydrate(state: State): Promise<void> {
    await this.dispatch('hydrate', state);
  }
}
