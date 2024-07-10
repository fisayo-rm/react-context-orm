import { render, waitFor, act, getByTestId } from '@testing-library/react';
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
      value: this.attr(0),
    };
  }

  get computed() {
    return this.value * 2;
  }

  set computed(val: number) {
    this.value = val / 2;
  }
}

class User extends Model {
  static entity = 'users';

  static fields() {
    return {
      id: this.attr(null),
      name: this.attr(''),
      posts: this.hasMany(Post, 'userId'),
    };
  }
}

class Post extends Model {
  static entity = 'posts';

  static fields() {
    return {
      id: this.attr(null),
      title: this.attr(''),
      userId: this.attr(null),
      user: this.belongsTo(User, 'userId'),
      comments: this.hasMany(Comment, 'postId'),
    };
  }
}

class Comment extends Model {
  static entity = 'comments';

  static fields() {
    return {
      id: this.attr(null),
      content: this.attr(''),
      postId: this.attr(null),
      post: this.belongsTo(Post, 'postId'),
    };
  }
}

class Product extends Model {
  static entity = 'products';

  static fields() {
    return {
      id: this.attr(null),
      price: this.attr(0),
      quantity: this.attr(0),
    };
  }

  get totalPrice() {
    return this.price * this.quantity;
  }

  set totalPrice(val) {}
}

type methodType =
  | 'create'
  | 'insert'
  | 'update'
  | 'insertOrUpdate'
  | 'delete'
  | 'deleteAll';

const TestComponent = ({
  payload,
  method,
  modelClass,
}: {
  payload: any;
  method: methodType;
  modelClass: typeof Model;
}) => {
  const state = useStoreState();
  const dispatch = useDispatch();

  useEffect(() => {
    modelClass.init(state, dispatch);
    // TestModel.init(dispatch);
    const executeMethod = async () => {
      // await TestModel.init(state, dispatch);
      await modelClass[method](payload);
      // await new Promise((resolve) => setTimeout(resolve, 0));
    };
    executeMethod();
  }, [method, payload, modelClass]);

  // useEffect(() => {
  //   TestModel.store = state;
  // }, [state]);

  return (
    <div>
      {/* NOTE: using toObject for serialization to prevent circular references*/}
      <div data-testid="state">
        {JSON.stringify(state, (key, value) =>
          value instanceof Model ? value.toObject() : value,
        )}
      </div>
    </div>
  );
};

beforeEach(() => {
  Model.store = {};
});

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
      <TestComponent modelClass={TestModel} payload={payload} method="create" />
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
      <TestComponent modelClass={TestModel} payload={payload} method="create" />
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
      <TestComponent modelClass={TestModel} payload={payload} method="insert" />
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
      <TestComponent
        modelClass={TestModel}
        payload={createPayload}
        method="create"
      />
      <TestComponent
        modelClass={TestModel}
        payload={insertPayload}
        method="insert"
      />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = Model.store;

    expect(state.test.length).toBe(3);
    expect(state.test.find((item: Model) => item.id === 1)).toBeDefined();
    expect(state.test.find((item: Model) => item.id === 2)).toBeDefined();
    expect(state.test.find((item: Model) => item.id === 3)).toBeDefined();
  });
});

test('Model should update records and update state', async () => {
  const createPayload = { data: { id: 1, name: 'test1' } };
  const updatePayload = { data: { id: 1, name: 'updatedTest1' } };

  render(
    <StoreProvider>
      <TestComponent
        modelClass={TestModel}
        payload={createPayload}
        method="create"
      />
      <TestComponent
        modelClass={TestModel}
        payload={updatePayload}
        method="update"
      />
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

  const { rerender } = render(
    <StoreProvider>
      <TestComponent
        modelClass={TestModel}
        payload={createPayload}
        method="create"
      />
    </StoreProvider>,
  );

  rerender(
    <StoreProvider>
      <TestComponent
        modelClass={TestModel}
        payload={insertOrUpdatePayload1}
        method="insertOrUpdate"
      />
    </StoreProvider>,
  );

  rerender(
    <StoreProvider>
      <TestComponent
        modelClass={TestModel}
        payload={insertOrUpdatePayload2}
        method="insertOrUpdate"
      />
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

  const { rerender } = render(
    <StoreProvider>
      <TestComponent
        modelClass={TestModel}
        payload={createPayload}
        method="create"
      />
    </StoreProvider>,
  );
  rerender(
    <StoreProvider>
      <TestComponent
        modelClass={TestModel}
        payload={deletePayload}
        method="delete"
      />
    </StoreProvider>,
  );

  // await act(async () => {
  //   const deletedItems = await TestModel.delete(deletePayload);
  //   expect(deletedItems.length).toBe(1);
  //   expect(deletedItems[0].id).toBe(1);
  //   // expect(deletedItems[1].id).toBe(2);
  // });

  await waitFor(() => {
    const state = Model.store;
    // const state = JSON.parse(getByTestId('state').textContent || '{}');
    // console.log('Store:', state);
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
      <TestComponent
        modelClass={TestModel}
        payload={createPayload}
        method="create"
      />
      {/* <TestComponent modelClass={TestModel} payload={deletePayload} method="delete" /> */}
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

test('Model should delete records by predicate and update state', async () => {
  const createPayload = {
    data: [
      { id: 1, name: 'test1' },
      { id: 2, name: 'test2' },
      { id: 3, name: 'other' },
    ],
  };
  const deletePredicate = (item: Model) => item.name.startsWith('test');

  const { rerender } = render(
    <StoreProvider>
      <TestComponent
        modelClass={TestModel}
        payload={createPayload}
        method="create"
      />
      {/* <TestComponent modelClass={TestModel} payload={deletePredicate} method="delete" /> */}
    </StoreProvider>,
  );

  rerender(
    <StoreProvider>
      {/* <TestComponent modelClass={TestModel} payload={createPayload} method="create" /> */}
      <TestComponent
        modelClass={TestModel}
        payload={deletePredicate}
        method="delete"
      />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = Model.store;
    // console.log('Store:', state);
    expect(state.test.length).toBe(1);
    expect(state.test[0].name).toBe('other');
  });

  // await act(async () => {
  //   const deletedItems = await TestModel.delete(deletePredicate);
  //   expect(deletedItems.length).toBe(2);
  //   expect(deletedItems[0].id).toBe(1);
  //   expect(deletedItems[1].id).toBe(2);
  // })
});

test('Model should delete all records and update state', async () => {
  const createPayload = {
    data: [
      { id: 1, name: 'test1' },
      { id: 2, name: 'test2' },
    ],
  };

  const { rerender } = render(
    <StoreProvider>
      <TestComponent
        modelClass={TestModel}
        payload={createPayload}
        method="create"
      />
    </StoreProvider>,
  );

  rerender(
    <StoreProvider>
      <TestComponent modelClass={TestModel} payload={{}} method="deleteAll" />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = Model.store;
    expect(state.test.length).toBe(0);
  });
});

test('Model should retrieve all records', async () => {
  const createPayload = {
    data: [
      { id: 1, name: 'test1' },
      { id: 2, name: 'test2' },
    ],
  };

  render(
    <StoreProvider>
      <TestComponent
        modelClass={TestModel}
        payload={createPayload}
        method="create"
      />
    </StoreProvider>,
  );

  await waitFor(() => {
    const allRecords = TestModel.all();
    expect(allRecords.length).toBe(2);
    expect(allRecords[0].id).toBe(1);
    expect(allRecords[0].name).toBe('test1');
    expect(allRecords[1].id).toBe(2);
    expect(allRecords[1].name).toBe('test2');
  });
});

test('Model should define and retrieve belongsTo relationship', async () => {
  const userPayload = { data: { id: 1, name: 'John Doe' } };
  const postPayload = { data: { id: 1, title: 'Hello World', userId: 1 } };

  const { rerender } = render(
    <StoreProvider>
      <TestComponent payload={userPayload} method="create" modelClass={User} />
    </StoreProvider>,
  );

  rerender(
    <StoreProvider>
      <TestComponent payload={postPayload} method="create" modelClass={Post} />
    </StoreProvider>,
  );

  await waitFor(() => {
    const post = Post.all()[0];

    expect(post.user.id).toBe(1);
    expect(post.user.name).toBe('John Doe');
  });
});

test('Model should define and retrieve hasMany relationship', async () => {
  const postPayload = { data: { id: 1, title: 'Hello World' } };
  const commentPayload = {
    data: [
      { id: 1, content: 'Nice post!', postId: 1 },
      { id: 2, content: 'Thanks for sharing.', postId: 1 },
    ],
  };

  const { rerender } = render(
    <StoreProvider>
      <TestComponent payload={postPayload} method="create" modelClass={Post} />
    </StoreProvider>,
  );

  rerender(
    <StoreProvider>
      <TestComponent
        payload={commentPayload}
        method="create"
        modelClass={Comment}
      />
    </StoreProvider>,
  );

  await waitFor(() => {
    const post = Post.all()[0];

    expect(post.comments.length).toBe(2);
    expect(post.comments[0].content).toBe('Nice post!');
    expect(post.comments[1].content).toBe('Thanks for sharing.');
  });
});

test('Model should use custom getter to compute a value', async () => {
  const payload = { data: { id: 1, value: 5 } };
  render(
    <StoreProvider>
      <TestComponent payload={payload} method="create" modelClass={TestModel} />
    </StoreProvider>,
  );

  await waitFor(() => {
    const instance = TestModel.find(1);
    expect(instance!.computed).toBe(10);
  });
});

test('Model should use custom setter to compute a value', async () => {
  const payload = { data: { id: 1 } };

  render(
    <StoreProvider>
      <TestComponent payload={payload} method="create" modelClass={TestModel} />
    </StoreProvider>,
  );

  await waitFor(() => {
    const instance = TestModel.find(1);
    expect(instance).toBeDefined();
    instance!.computed = 20;
    expect(instance!.value).toBe(10);
  });
});

test('Model should assign default value', async () => {
  const payload = { data: { id: 1 } };

  render(
    <StoreProvider>
      <TestComponent payload={payload} method="create" modelClass={TestModel} />
    </StoreProvider>,
  );

  await waitFor(() => {
    const instance = TestModel.find(1) as TestModel;
    expect(instance.name).toBe('');
    expect(instance.value).toBe(0);
  });
});

test('Model should override default values with provided values', async () => {
  const payload = { data: { id: 1, name: 'test', value: 42 } };

  render(
    <StoreProvider>
      <TestComponent payload={payload} method="create" modelClass={TestModel} />
    </StoreProvider>,
  );

  await waitFor(() => {
    const instance = TestModel.find(1) as TestModel;
    expect(instance.name).toBe('test');
    expect(instance.value).toBe(42);
  });
});
