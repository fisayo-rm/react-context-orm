import { State } from './ModelContext';

interface Attribute {
  value: any;
  make(value: any): any;
}

interface Fields {
  [key: string]: Attribute;
}

interface FieldCache {
  [key: string]: Fields;
}

interface Record {
  [field: string]: any;
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
    this.store = state;
  }

  constructor(record?: Record) {
    this.$fill(record);
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

  $fill(record: Record = {}): void {
    const fields = this.$fields();

    for (const key in fields) {
      const field = fields[key];
      const value = record[key];

      this[key] = field.make(value);
    }

    record.$id !== undefined && this.$setIndex(record.$id);
  }

  $setIndex(id: string | null): this {
    this.$id = id;

    return this;
  }

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
    // Placeholder for the insertOrUpdate logic
  }

  static delete<T extends typeof Model>(this: T, payload: any): any {
    // Placeholder for the delete logic
  }

  static deleteAll<T extends typeof Model>(this: T, payload: any): any {
    // Placeholder for the deleteAll logic
  }

  static all<T extends typeof Model>(this: T, payload: any): any {
    // Placeholder for the all logic
  }
}
