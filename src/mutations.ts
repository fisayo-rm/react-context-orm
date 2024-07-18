import { Mutation } from './interfaces';
import { Model } from './Model';

export const mutations: Record<string, Mutation> = {
  create: (state, payload) => {
    const { entity, data } = payload;
    state[entity] = data[entity];
  },
  insert: (state, payload) => {
    const { entity, data } = payload;
    state[entity] = state[entity]
      ? [...state[entity], ...data[entity]]
      : data[entity];
  },
  update: (state, payload) => {
    const { entity, data } = payload;
    state[entity] = state[entity].map((item: any) =>
      item.id === data[entity][0].id ? data[entity][0] : item,
    );
  },
  insertOrUpdate: (state, payload) => {
    const { entity, data } = payload;
    state[entity] = state[entity] ? [...state[entity]] : [];

    data[entity].forEach((newItem: any) => {
      const index = state[entity].findIndex(
        (item: any) => item.id === newItem.id,
      );
      if (index !== -1) {
        state[entity][index] = newItem;
      } else {
        state[entity].push(newItem);
      }
    });
  },
  delete: (state, payload) => {
    const { entity, arg } = payload;

    if (typeof arg === 'function') {
      state[entity] = state[entity].filter((item: Model) => !arg(item));
    } else if (Array.isArray(arg)) {
      state[entity] = state[entity].filter(
        (item: Model) => !arg.includes(item.id),
      );
    } else {
      state[entity] = state[entity].filter((item: Model) => item.id !== arg);
    }
  },
  deleteAll: (state, payload) => {
    const { entity } = payload;
    state[entity] = [];
  },
  reset: (state) => {
    for (const entity in state) {
      delete state[entity];
    }
  },
};
