import { render, waitFor } from '@testing-library/react';
import { Model } from '../src/Model';
import { useDispatch, useStoreState, StoreProvider } from '../src/ModelContext';
import { useEffect } from 'react';

class TestModel extends Model {
  static entity = 'test';
  // id!: number;
  // name!: string;

  static fields() {
    return {
      id: this.attr(null),
      name: this.attr(''),
    };
  }
}

const TestComponent = ({ payload }: { payload: any }) => {
  const state = useStoreState();
  const dispatch = useDispatch();

  useEffect(() => {
    TestModel.init(state, dispatch);
    const createModel = async () => {
      // await TestModel.init(state, dispatch);
      await TestModel.create(payload);
    };
    createModel();
  }, []);

  // useEffect(() => {
  //   TestModel.store = state;
  // }, [state]);

  return (
    <div>
      <div data-testid="state">{JSON.stringify(state)}</div>
    </div>
  );
};

const InsertComponent = ({ payload }: { payload: any }) => {
  const state = useStoreState();
  const dispatch = useDispatch();

  useEffect(() => {
    TestModel.init(state, dispatch);

    const insertModel = async () => {
      await TestModel.insert(payload);
    };
    insertModel();
  }, []);

  return (
    <div>
      <div data-testid="state">{JSON.stringify(state)}</div>
    </div>
  );
};

const CreateAndInsertComponent = ({
  createPayload,
  insertPayload,
}: {
  createPayload: any;
  insertPayload: any;
}) => {
  const state = useStoreState();
  const dispatch = useDispatch();

  useEffect(() => {
    TestModel.init(state, dispatch);

    const createAndInsertModel = async () => {
      await TestModel.create(createPayload);
      await TestModel.insert(insertPayload);
      // await TestModel.create(createPayload);
    };
    createAndInsertModel();
  }, []);

  return (
    <div>
      <div data-testid="state">{JSON.stringify(state)}</div>
    </div>
  );
};

test('Model should be defined', () => {
  expect(Model).toBeDefined();
});

test('Model should create an instance with default values', () => {
  const instance = new TestModel();
  expect(instance.id).toBe(null);
  expect(instance.name).toBe('');
});

test('Model should create an instance with given values', () => {
  const instance = new TestModel({ id: 1, name: 'test' });
  expect(instance.id).toBe(1);
  expect(instance.name).toBe('test');
});

test('Model should dispatch create action with payload and update state', async () => {
  const payload = { data: { id: 1, name: 'test' } };

  const { getByTestId } = render(
    <StoreProvider>
      <TestComponent payload={payload} />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = JSON.parse(getByTestId('state').textContent || '{}');
    expect(state.test).toBeDefined();
    expect(state.test.some((item: TestModel) => item.name === 'test')).toBe(
      true,
    );
  });
});

test('Model static store property should be updated', async () => {
  const payload = { data: { id: 2, name: 'test2' } };

  render(
    <StoreProvider>
      <TestComponent payload={payload} />
    </StoreProvider>,
  );

  await waitFor(() => {
    // Log the store property for debugging
    // console.log('TestModel Store:', TestModel.store);
    // console.log('Model Store:', Model.store);

    // Verify the static store property is updated
    const state = Model.store;
    const instance = state.test.find((item: TestModel) => item.id === 2);
    expect(instance).toBeDefined();
    expect(instance.name).toBe('test2');
  });
});

test('Model should insert records and update state', async () => {
  const payload = {
    data: [
      { id: 3, name: 'test3' },
      { id: 4, name: 'test4' },
    ],
  };

  render(
    <StoreProvider>
      <InsertComponent payload={payload} />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = Model.store;
    expect(state.test.length).toBe(2);
    expect(state.test.find((item: Model) => item.id === 3)).toBeDefined();
    expect(state.test.find((item: Model) => item.id === 4)).toBeDefined();
  });
});

test('Model should create and insert records and update state', async () => {
  const createPayload = { data: { id: 1, name: 'test1' } };
  const insertPayload = {
    data: [
      { id: 2, name: 'test2' },
      { id: 3, name: 'test3' },
    ],
  };

  render(
    <StoreProvider>
      <CreateAndInsertComponent
        createPayload={createPayload}
        insertPayload={insertPayload}
      />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = Model.store;

    expect(state.test.length).toBe(3);
    expect(state.test.find((item: Model) => item.id === 1)).toBeDefined();
    expect(state.test.find((item: Model) => item.id === 2)).toBeDefined();
    expect(state.test.find((item: Model) => item.id === 3)).toBeDefined();

    // expect(state.test.length).toBe(1);
    // expect(state.test.find((item: Model) => item.id === 1)).toBeDefined();
    // expect(state.test.find((item: Model) => item.id === 2)).toBeUndefined();
    // expect(state.test.find((item: Model) => item.id === 3)).toBeUndefined();
  });
});
