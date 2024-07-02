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
      await TestModel.create({ data: payload });
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
  const payload = { id: 1, name: 'test' };

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
  const payload = { id: 2, name: 'test2' };

  const { getByTestId } = render(
    <StoreProvider>
      <TestComponent payload={payload} />
    </StoreProvider>,
  );

  await waitFor(() => {
    // Log the store property for debugging
    console.log('TestModel Store:', TestModel.store);
    console.log('Model Store:', Model.store);

    // Verify the static store property is updated
    const state = Model.store;
    const instance = state.test.find((item: TestModel) => item.id === 2);
    expect(instance).toBeDefined();
    expect(instance.name).toBe('test2');
  });
});
