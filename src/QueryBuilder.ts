import { Model } from './Model';

interface QueryBuilderOptions {
  relations: { [key: string]: (qb: QueryBuilder<any>) => void };
  order: { field: string; direction: 'asc' | 'desc' }[];
}

export class QueryBuilder<T extends typeof Model> {
  private modelClass: T;
  private options: QueryBuilderOptions = { relations: {}, order: [] };

  constructor(modelClass: T) {
    this.modelClass = modelClass;
  }

  with(
    relations: string | string[],
    query?: (qb: QueryBuilder<any>) => void,
  ): this {
    if (Array.isArray(relations)) {
      relations.forEach((relation) => {
        this.options.relations[relation] = query || (() => {});
      });
    } else {
      this.options.relations[relations] = query || (() => {});
    }
    return this;
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.options.order.push({ field, direction });
    return this;
  }

  find(id: any): InstanceType<T> | undefined {
    const instance = this.modelClass.find(id);

    if (!instance) return undefined;

    const instanceCopy = this.copyInstance(instance);
    this.loadRelations(instanceCopy);

    return instanceCopy;
  }

  private copyInstance(instance: InstanceType<T>): InstanceType<T> {
    const copy = Object.assign(
      Object.create(Object.getPrototypeOf(instance)),
      instance,
    );
    return copy;
  }

  private loadRelations(instance: InstanceType<T>) {
    for (const relation in this.options.relations) {
      const parts = relation.split('.');
      let currentModel: any = instance;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          currentModel = currentModel[part];
          if (Array.isArray(currentModel)) {
            this.options.relations[relation](this); // Apply the nested query options
            this.applyOrder(currentModel);
            currentModel.forEach((item: any) => item.$loadRelated());
          } else if (currentModel) {
            this.options.relations[relation](this); // Apply the nested query options
            currentModel.$loadRelated();
          }
        } else {
          currentModel = currentModel[part];
          if (Array.isArray(currentModel)) {
            currentModel.forEach((item: any) => item.$loadRelated());
          } else if (currentModel) {
            currentModel.$loadRelated();
          }
        }
      });
    }
  }

  private applyOrder(items: any[]) {
    this.options.order.forEach(({ field, direction }) => {
      items.sort((a: any, b: any) => {
        if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
        if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    });
  }
}
