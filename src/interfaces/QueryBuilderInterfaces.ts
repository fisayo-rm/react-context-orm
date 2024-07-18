import { QueryBuilder } from '../QueryBuilder';

/**
 * Interface representing the options for a query builder.
 */
export interface QueryBuilderOptions {
  relations: { [key: string]: (qb: QueryBuilder<any>) => void };
  order: { field: string; direction: 'asc' | 'desc' }[];
}
