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
        state,
        commit: (mutationType: string, mutationPayload?: any) => {
          reactDispatch({ type: mutationType, payload: mutationPayload });
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
