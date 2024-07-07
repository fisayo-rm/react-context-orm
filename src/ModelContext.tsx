import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import { Model } from './Model';
interface Entity {
  id: number | string;
  [field: string]: any;
}

interface NormalizedData {
  [key: string]: { [key: string]: Entity & { $id: string } };
}

export type State = Record<string, any>;
type Action = { type: string; payload?: any };
type ActionCreator = (
  context: ActionContext,
  payload?: any,
) => Promise<any> | void;
type Mutation = (state: State, payload?: any) => void;
type ActionContext = {
  state: State;
  commit: (type: string, payload?: any) => void;
  dispatch: (type: string, payload?: any) => Promise<any>;
};

const StoreStateContext = createContext<State | undefined>(undefined);
const StoreDispatchContext = createContext<
  ((type: string, payload?: any) => Promise<any>) | undefined
>(undefined);

export const useStoreState = () => {
  const context = useContext(StoreStateContext);
  if (context === undefined) {
    throw new Error('useState must be used within a StoreProvider');
  }
  return context;
};

export const useDispatch = () => {
  const context = useContext(StoreDispatchContext);
  if (context === undefined) {
    throw new Error('useDispatch must be used within a StoreProvider');
  }
  return context;
};

function normalizeData(
  entity: string,
  data: Entity | Entity[],
): NormalizedData {
  const result: NormalizedData = {};
  result[entity] = {};

  if (Array.isArray(data)) {
    data.forEach((item) => {
      result[entity][item.id] = { ...item, $id: item.id.toString() };
    });
  } else {
    result[entity][data.id] = { ...data, $id: data.id.toString() };
  }
  return result;
}

function createRecords(normalizedData: NormalizedData, model: typeof Model) {
  const entity: string = model.entity;
  if (!normalizedData[entity]) {
    throw new Error(`No data found for type: ${model.entity}`);
  }

  const records = Object.values(normalizedData[entity]).map(
    (record) => new model(record),
  );
  return { [entity]: records };
}

const mutations: Record<string, Mutation> = {
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
};

const actions: Record<string, ActionCreator> = {
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
};

export const StoreProvider: React.FC<{
  children: ReactNode;
  initialState?: State;
}> = ({ children, initialState = {} }) => {
  const reducer = (state: State, action: Action) => {
    const mutation = mutations[action.type];
    if (mutation) {
      const newState = { ...state };
      mutation(newState, action.payload);
      Model.store = newState;
      return newState;
    }
    return state;
  };

  const [state, reactDispatch] = useReducer(reducer, initialState);

  const dispatch = async (type: string, payload?: any) => {
    const action = actions[type];
    if (action) {
      const context: ActionContext = {
        state: Model.store,
        // state,
        commit: (mutationType: string, mutationPayload?: any) => {
          reactDispatch({
            type: mutationType,
            payload: mutationPayload,
          });
        },
        dispatch: (actionType: string, actionPayload?: any) =>
          dispatch(actionType, actionPayload),
      };
      return action(context, payload);
    }
    throw new Error(`Unknown action type: ${type}`);
  };

  return (
    <StoreStateContext.Provider value={state}>
      <StoreDispatchContext.Provider value={dispatch}>
        {children}
      </StoreDispatchContext.Provider>
    </StoreStateContext.Provider>
  );
};
