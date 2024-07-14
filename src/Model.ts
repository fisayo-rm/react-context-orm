import { State } from './ModelContext';
import { QueryBuilder } from './QueryBuilder';

interface Attribute {
  value: any;
  make(value: any): any;
}

interface Fields {
  [key: string]: Attribute | Relationship;
}

interface FieldCache {
  [key: string]: Fields;
}

interface ModelRecord {
  [field: string]: any;
}

// TODO: try to use this
// interface State {
//   [entity: string]: ModelRecord[];
// }

type Predicate<T> = (item: T) => boolean;

interface Relationship {
  type: string;
  relatedModel: typeof Model;
  foreignKey: string;
}

export class Model {
  [key: string]: any;
  static entity: string;

  static cachedFields: FieldCache;

  $id: string | null = null;

  static dispatch: (type: string, payload?: any) => Promise<any>;

  static store: State;

  static init(
    state: State,
    dispatch: (type: string, payload?: any) => Promise<any>,
  ) {
    this.dispatch = dispatch;
    // TODO: this should probably be Model.store
    this.store = state;
  }

  constructor(record?: ModelRecord) {
    this.$fill(record);
    this.$loadRelated();
    // this.$defineGettersAndSetters();
  }

  static fields(): Fields {
    return {};
  }

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

  static getFields(): Fields {
    this.cachedFields ??= {};
    this.cachedFields[this.entity] ??= this.fields();

    return this.cachedFields[this.entity];
  }

  $self(): typeof Model {
    return this.constructor as typeof Model;
  }

  $fields(): Fields {
    return this.$self().getFields();
  }

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

  $setIndex(id: string | null): this {
    this.$id = id;

    return this;
  }

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

  // To prevent circular references when handling serialization
  toObject(): ModelRecord {
    const record: ModelRecord = {};
    const fields = this.$fields();

    for (const key in fields) {
      if (isAttribute(fields[key])) {
        record[key] = this[key];
      }
    }
    return record;
  }

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

  static create<T extends typeof Model>(this: T, payload: any): any {
    payload.model = this;
    return this.dispatch('create', payload);
  }

  static insert<T extends typeof Model>(this: T, payload: any): any {
    payload.model = this;
    return this.dispatch('insert', payload);
  }

  static update<T extends typeof Model>(this: T, payload: any): any {
    payload.model = this;
    return this.dispatch('update', payload);
  }

  static insertOrUpdate<T extends typeof Model>(this: T, payload: any): any {
    payload.model = this;
    return this.dispatch('insertOrUpdate', payload);
  }

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

  static deleteAll<T extends typeof Model>(this: T): Promise<void> {
    const payload = { model: this };
    return this.dispatch('deleteAll', payload);
  }

  static all<T extends typeof Model>(this: T): InstanceType<T>[] {
    return Model.store[this.entity] || [];
  }

  static belongsTo(
    relatedModel: typeof Model,
    foreignKey: string,
  ): Relationship {
    return { type: 'belongsTo', relatedModel, foreignKey };
  }

  static hasMany(relatedModel: typeof Model, foreignKey: string): Relationship {
    return { type: 'hasMany', relatedModel, foreignKey };
  }

  static find<T extends typeof Model>(
    this: T,
    id: string | number,
  ): InstanceType<T> | undefined {
    return (
      Model.store[this.entity]?.find((item: Model) => item.id == id) || null
    );
  }

  static query<T extends typeof Model>(this: T): QueryBuilder<T> {
    return new QueryBuilder(this);
  }
}

function isAttribute(field: Attribute | Relationship): field is Attribute {
  return (field as Attribute).make !== undefined;
}

function isRelationship(
  field: Attribute | Relationship,
): field is Relationship {
  return (field as Relationship).type !== undefined;
}
