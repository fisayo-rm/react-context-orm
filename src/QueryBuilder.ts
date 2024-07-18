import { Model } from './Model';
import { QueryBuilderOptions } from './interfaces';

/**
 * Class representing a query builder for models.
 */
export class QueryBuilder<T extends typeof Model> {
  private modelClass: T;
  private options: QueryBuilderOptions = { relations: {}, order: [] };

  /**
   * Creates an instance of QueryBuilder.
   * @param modelClass The model class to build queries for.
   */
  constructor(modelClass: T) {
    this.modelClass = modelClass;
  }

  /**
   * Specifies relationships to be loaded with the model.
   * @param relations The relationships to load.
   * @param query Optional query function to apply to the relationship.
   * @returns The query builder instance.
   */
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

  /**
   * Specifies the order for the query results.
   * @param field The field to order by.
   * @param direction The direction to order by (asc or desc).
   * @returns The query builder instance.
   */
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.options.order.push({ field, direction });
    return this;
  }

  /**
   * Finds a model instance by its ID.
   * @param id The ID of the model instance.
   * @returns The found model instance or undefined.
   */
  find(id: any): InstanceType<T> | undefined {
    const instance = this.modelClass.find(id);

    if (!instance) return undefined;

    const instanceCopy = this.copyInstance(instance);
    this.loadRelations(instanceCopy);

    return instanceCopy;
  }

  /**
   * Creates a copy of the model instance.
   * @param instance The model instance to copy.
   * @returns The copied model instance.
   */
  private copyInstance(instance: InstanceType<T>): InstanceType<T> {
    const copy = Object.assign(
      Object.create(Object.getPrototypeOf(instance)),
      instance,
    );
    return copy;
  }

  /**
   * Loads the specified relationships for the model instance.
   * @param instance The model instance to load relationships for.
   */
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

  /**
   * Applies the specified order to the query results.
   * @param items The items to order.
   */
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
