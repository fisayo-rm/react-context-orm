import { Model } from '../Model';
import { ActionCreator } from '../interfaces';
import { normalizeData, createRecords } from '../utils';

export const actions: Record<string, ActionCreator> = {
  create: async ({ commit }, payload) => {
    const { model, ...restPayload } = payload;
    const normalizedData = normalizeData(model.entity, restPayload.data);
    const records = createRecords(normalizedData, model);
    commit('create', { data: records, entity: model.entity });
    return records;
  },
  insert: async ({ commit }, payload) => {
    const { model, ...restPayload } = payload;
    const normalizedData = normalizeData(model.entity, restPayload.data);
    const records = createRecords(normalizedData, model);
    commit('insert', { data: records, entity: model.entity });
    return records;
  },
  update: async ({ commit }, payload) => {
    const { model, ...restPayload } = payload;
    const normalizedData = normalizeData(model.entity, restPayload.data);
    const records = createRecords(normalizedData, model);
    commit('update', { data: records, entity: model.entity });
  },
  insertOrUpdate: async ({ commit }, payload) => {
    const { model, ...restPayload } = payload;
    const normalizedData = normalizeData(model.entity, restPayload.data);
    const records = createRecords(normalizedData, model);
    commit('insertOrUpdate', { data: records, entity: model.entity });
  },
  delete: async ({ commit, state }, payload) => {
    const { model, arg } = payload;
    let deletedItems: any = [];

    if (typeof arg === 'function') {
      deletedItems = state[model.entity].filter((item: Model) => arg(item));
    } else if (Array.isArray(arg)) {
      deletedItems = state[model.entity].filter((item: Model) =>
        arg.includes(item.id),
      );
    } else {
      deletedItems = state[model.entity].filter(
        (item: Model) => item.id === arg,
      );
    }
    commit('delete', { entity: model.entity, arg });
    return deletedItems;
  },
  deleteAll: async ({ commit }, payload) => {
    const { model } = payload;
    commit('deleteAll', { entity: model.entity });
  },
  reset: ({ commit }) => {
    commit('reset');
  },
};
