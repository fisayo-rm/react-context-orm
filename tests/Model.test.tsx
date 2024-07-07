import { render, waitFor, act } from '@testing-library/react';
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

type methodType = 'create' | 'insert' | 'update' | 'insertOrUpdate' | 'delete';

const TestComponent = ({
  payload,
  method,
}: {
  payload: any;
  method: methodType;
}) => {
  const state = useStoreState();
  const dispatch = useDispatch();

  useEffect(() => {
    TestModel.init(state, dispatch);
    const executeMethod = async () => {
      // await TestModel.init(state, dispatch);
      await TestModel[method](payload);
    };
    executeMethod();
  }, [method, payload]);

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
  const payload = { data: { id: 1, name: 'test' } };

  const { getByTestId } = render(
    <StoreProvider>
      <TestComponent payload={payload} method="create" />
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

  const { getByTestId } = render(
    <StoreProvider>
      <TestComponent payload={payload} method="create" />
    </StoreProvider>,
  );

  await waitFor(() => {
    // Log the store property for debugging
    // console.log('TestModel Store:', TestModel.store);
    // console.log('Model Store:', Model.store);

    // Verify the static store property is updated
    // const state = Model.store;
    const state = JSON.parse(getByTestId('state').textContent || '{}');
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
      <TestComponent payload={payload} method="insert" />
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
      <TestComponent payload={createPayload} method="create" />
      <TestComponent payload={insertPayload} method="insert" />
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

test('Model should update records and update state', async () => {
  const createPayload = { data: { id: 1, name: 'test1' } };
  const updatePayload = { data: { id: 1, name: 'updatedTest1' } };

  render(
    <StoreProvider>
      <TestComponent payload={createPayload} method="create" />
      <TestComponent payload={updatePayload} method="update" />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = Model.store;
    const instance = state.test.find((item: Model) => item.id === 1);
    expect(instance).toBeDefined();
    expect(instance.name).toBe('updatedTest1');
  });
});

test('Model should insertOrUpdate records and update state', async () => {
  const createPayload = { data: { id: 1, name: 'test1' } };
  const insertOrUpdatePayload1 = {
    data: [
      { id: 1, name: 'updatedTest1' },
      { id: 2, name: 'test2' },
    ],
  };
  const insertOrUpdatePayload2 = {
    data: [
      { id: 2, name: 'updatedTest2' },
      { id: 3, name: 'test3' },
    ],
  };

  render(
    <StoreProvider>
      <TestComponent payload={createPayload} method="create" />
      <TestComponent payload={insertOrUpdatePayload1} method="insertOrUpdate" />
      <TestComponent payload={insertOrUpdatePayload2} method="insertOrUpdate" />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = Model.store;
    expect(state.test.length).toBe(3);
    expect(state.test.find((item: Model) => item.id === 1).name).toBe(
      'updatedTest1',
    );
    expect(state.test.find((item: Model) => item.id === 2).name).toBe(
      'updatedTest2',
    );
    expect(state.test.find((item: Model) => item.id === 3).name).toBeDefined();
    expect(state.test.find((item: Model) => item.id === 3).name).toBe('test3');
  });
});

test('Model should delete a record by id and update state', async () => {
  const createPayload = { data: { id: 1, name: 'test1' } };
  const deletePayload = 1;

  const { getByTestId } = render(
    <StoreProvider>
      <TestComponent payload={createPayload} method="create" />
      <TestComponent payload={deletePayload} method="delete" />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = Model.store;
    // const state = JSON.parse(getByTestId('state').textContent || '{}');
    const instance = state.test.find((item: Model) => item.id === 1);
    expect(instance).toBeUndefined();
  });
});

test('Model should delete multiple records by ids and update state', async () => {
  const createPayload = {
    data: [
      { id: 1, name: 'test1' },
      { id: 2, name: 'test2' },
    ],
  };
  const deletePayload = [1, 2];

  render(
    <StoreProvider>
      <TestComponent payload={createPayload} method="create" />
      {/* <TestComponent payload={deletePayload} method="delete" /> */}
    </StoreProvider>,
  );

  await act(async () => {
    const deletedItems = await TestModel.delete(deletePayload);
    expect(deletedItems.length).toBe(2);
    expect(deletedItems[0].id).toBe(1);
    expect(deletedItems[1].id).toBe(2);
  });

  await waitFor(() => {
    const state = Model.store;
    expect(state.test.length).toBe(0);
  });
});

// Alternative Approach

// class TestModel extends Model {
//   static entity = 'test';

//   static fields() {
//     return {
//       id: Model.attr(null),
//       name: Model.attr(''),
//     };
//   }
// }

// type Operation = {
//   method: 'create' | 'insert' | 'update';
//   payload: any;
// };

// const TestComponent = ({ operations }: { operations: Operation[] }) => {
//   const state = useStoreState();
//   const dispatch = useDispatch();

//   useEffect(() => {
//     // Initialize Model with the dispatch function and state
//     TestModel.init(state, dispatch);

//     const runOperations = async () => {
//       for (const operation of operations) {
//         await TestModel[operation.method](operation.payload);
//       }
//     };
//     runOperations();
//   }, [operations]); // Ensure this runs only once after mount

//   return (
//     <div>
//       <div data-testid="state">{JSON.stringify(state)}</div>
//     </div>
//   );
// };

// test('Model should be defined', () => {
//   expect(Model).toBeDefined();
// });

// test('Model should create an instance with default values', () => {
//   const instance = new TestModel();
//   expect(instance.id).toBe(null);
//   expect(instance.name).toBe('');
// });

// test('Model should create an instance with given values', () => {
//   const instance = new TestModel({ id: 1, name: 'test' });
//   expect(instance.id).toBe(1);
//   expect(instance.name).toBe('test');
// });

// test('Model should dispatch create action with payload and update state', async () => {
//   const payload = { data: { id: 1, name: 'test' } };

//   const { getByTestId } = render(
//     <StoreProvider>
//       <TestComponent operations={[{ method: 'create', payload }]} />
//     </StoreProvider>,
//   );

//   await waitFor(() => {
//     const state = JSON.parse(getByTestId('state').textContent || '{}');
//     const instance = state.test[0];
//     expect(instance).toBeDefined();
//     expect(instance.name).toBe('test');
//   });
// });

// test('Model static store property should be updated', async () => {
//   const payload = { data: { id: 2, name: 'test2' } };

//   render(
//     <StoreProvider>
//       <TestComponent operations={[{ method: 'create', payload }]} />
//     </StoreProvider>,
//   );

//   await waitFor(() => {
//     // Log the store property for debugging
//     console.log('Store:', TestModel.store);
//     console.log('Model Store:', Model.store);

//     // Verify the static store property is updated
//     const state = Model.store; // Reference Model.store for consistency
//     const instance = state.test.find((item: any) => item.id === 2);
//     expect(instance).toBeDefined();
//     expect(instance.name).toBe('test2');
//   });
// });

// test('Model should insert records and update state', async () => {
//   const payload = {
//     data: [
//       { id: 3, name: 'test3' },
//       { id: 4, name: 'test4' },
//     ],
//   };

//   const { getByTestId } = render(
//     <StoreProvider>
//       <TestComponent operations={[{ method: 'insert', payload }]} />
//     </StoreProvider>,
//   );

//   await waitFor(() => {
//     // Verify the static store property is updated
//     const state = Model.store;
//     console.log('Store:', state);
//     expect(state.test.length).toBe(2);
//     expect(state.test.find((item: any) => item.id === 3)).toBeDefined();
//     expect(state.test.find((item: any) => item.id === 4)).toBeDefined();
//   });
// });

// test('Model should create and insert records and update state', async () => {
//   const createPayload = { data: { id: 1, name: 'test1' } };
//   const insertPayload = {
//     data: [
//       { id: 2, name: 'test2' },
//       { id: 3, name: 'test3' },
//     ],
//   };

//   render(
//     <StoreProvider>
//       <TestComponent
//         operations={[
//           { method: 'create', payload: createPayload },
//           { method: 'insert', payload: insertPayload },
//         ]}
//       />
//     </StoreProvider>,
//   );

//   await waitFor(() => {
//     // Verify the static store property is updated
//     const state = Model.store;
//     console.log('Store:', state);
//     expect(state.test.length).toBe(3);
//     expect(state.test.find((item: any) => item.id === 1)).toBeDefined();
//     expect(state.test.find((item: any) => item.id === 2)).toBeDefined();
//     expect(state.test.find((item: any) => item.id === 3)).toBeDefined();
//   });
// });

// test('Model should update records and update state', async () => {
//   const createPayload = { data: { id: 1, name: 'test1' } };
//   const updatePayload = { data: { id: 1, name: 'updatedTest1' } };

//   render(
//     <StoreProvider>
//       <TestComponent
//         operations={[
//           { method: 'create', payload: createPayload },
//           { method: 'update', payload: updatePayload },
//         ]}
//       />
//     </StoreProvider>,
//   );

//   await waitFor(() => {
//     // Verify the static store property is updated
//     const state = Model.store;
//     console.log('Store:', state);
//     const instance = state.test.find((item: any) => item.id === 1);
//     expect(instance).toBeDefined();
//     expect(instance.name).toBe('updatedTest1');
//   });
// });
