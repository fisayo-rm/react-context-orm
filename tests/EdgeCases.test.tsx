import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { StoreProvider } from '../src/ModelContext';
import { useStoreState, useDispatch } from '../src/context';
import { Model } from '../src/Model';
import { User, Post, Comment } from './Models';

beforeEach(() => {
  Model.store = {};
});

class ExampleModel extends Model {
  static entity = 'examples';

  static fields() {
    return {
      id: this.attr(null),
      name: this.attr(''),
    };
  }
}

const EdgeCaseComponent: React.FC = () => {
  const state = useStoreState();
  const dispatch = useDispatch();

  React.useEffect(() => {
    ExampleModel.init(state, dispatch);

    const runTests = async () => {
      // Create an instance
      await ExampleModel.create({ data: { id: 1, name: 'test' } });

      // Update an instance
      await ExampleModel.update({ data: { id: 1, name: 'updated' } });

      // Delete an instance
      await ExampleModel.delete(1);

      // Check state
      console.log('Store:', ExampleModel.store);
    };

    runTests();
  }, []);

  return <div data-testid="state">{JSON.stringify(state)}</div>;
};

test('Edge case handling and state validation for ExampleModel', async () => {
  const { getByTestId } = render(
    <StoreProvider>
      <EdgeCaseComponent />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = getByTestId('state').textContent;
    expect(state).not.toContain('test');
    expect(state).not.toContain('updated');
  });
});

class ConcurrentModel extends Model {
  static entity = 'concurrent';

  static fields() {
    return {
      id: this.attr(null),
      name: this.attr(''),
    };
  }
}

const ConcurrentUpdatesComponent: React.FC = () => {
  const state = useStoreState();
  const dispatch = useDispatch();

  React.useEffect(() => {
    ConcurrentModel.init(state, dispatch);

    const runTests = async () => {
      const createPayloads = [
        { data: { id: 1, name: 'test1' } },
        { data: { id: 2, name: 'test2' } },
        { data: { id: 1, name: 'updatedTest1' } },
      ];

      await Promise.all(
        createPayloads.map((payload) =>
          ConcurrentModel.insertOrUpdate(payload),
        ),
      );

      console.log('Store:', ConcurrentModel.store);
    };
    runTests();
  }, []);

  return <div data-testid="state">{JSON.stringify(state)}</div>;
};

test('Concurrent state updates for ConcurrentModel', async () => {
  const { getByTestId } = render(
    <StoreProvider>
      <ConcurrentUpdatesComponent />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = JSON.parse(getByTestId('state').textContent || '{}');
    expect(state.concurrent).toHaveLength(2);
    expect(
      state.concurrent.find((item: ConcurrentModel) => item.id === 1).name,
    ).toBe('updatedTest1');
    expect(
      state.concurrent.find((item: ConcurrentModel) => item.id === 2).name,
    ).toBe('test2');
  });
});

const DeepNestedRelationshipsComponent: React.FC = () => {
  const state = useStoreState();
  const dispatch = useDispatch();

  React.useEffect(() => {
    User.init(state, dispatch);
    Post.init(state, dispatch);
    Comment.init(state, dispatch);

    const runTests = async () => {
      // Create a user
      await User.create({ data: { id: 1, name: 'Alice' } });

      // Create posts for the user
      await Post.create({
        data: [
          { id: 1, userId: 1, title: 'Post 1' },
          { id: 2, userId: 1, title: 'Post 2' },
        ],
      });

      // Create comments for the posts
      await Comment.create({
        data: [
          { id: 1, postId: 1, content: 'Comment 1 on Post 1' },
          { id: 2, postId: 1, content: 'Comment 2 on Post 1' },
          { id: 3, postId: 2, content: 'Comment 1 on Post 2' },
        ],
      });

      // Check state
      console.log('Store:', User.store);
    };

    runTests();
  }, []);

  return <div data-testid="state">{JSON.stringify(state)}</div>;
};

test('Deep nested relationships for User, Post, and Comment', async () => {
  const { getByTestId } = render(
    <StoreProvider>
      <DeepNestedRelationshipsComponent />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = JSON.parse(getByTestId('state').textContent || '{}');

    const user = state.users.find((u: any) => u.id === 1);
    expect(user).toBeDefined();
    expect(user.posts).toHaveLength(2);

    const post1 = user.posts.find((p: any) => p.id === 1);
    expect(post1).toBeDefined();
    expect(post1.comments).toHaveLength(2);
    expect(post1.comments[0].content).toBe('Comment 1 on Post 1');
    expect(post1.comments[1].content).toBe('Comment 2 on Post 1');

    const post2 = user.posts.find((p: any) => p.id === 2);
    expect(post2).toBeDefined();
    expect(post2.comments).toHaveLength(1);
    expect(post2.comments[0].content).toBe('Comment 1 on Post 2');
  });
});

class ValidatedModel extends Model {
  static entity = 'validated';

  static fields() {
    return {
      id: this.attr(null),
      name: this.attr(''),
      age: this.attr(null),
    };
  }

  static validate(record: Record<string, any>): boolean {
    if (typeof record.name !== 'string' || record.name === '') {
      throw new Error('Name is required and should be a string');
    }
    if (typeof record.age !== 'number' || isNaN(record.age)) {
      throw new Error('Age should be a number');
    }
    return true;
  }

  static async create(payload: any): Promise<any> {
    this.validate(payload.data);
    return super.create(payload);
  }

  static async insertOrUpdate(payload: any): Promise<any> {
    this.validate(payload.data);
    return super.insertOrUpdate(payload);
  }
}

const InvalidDataHandlingComponent: React.FC = () => {
  const state = useStoreState();
  const dispatch = useDispatch();

  React.useEffect(() => {
    ValidatedModel.init(state, dispatch);

    const runTests = async () => {
      try {
        // Create with invalid data
        await ValidatedModel.create({
          data: { id: 1, name: '', age: 'not_a_number' },
        });
      } catch (error: any) {
        console.error('Create Error:', error.message);
      }

      try {
        // InsertOrUpdate with invalid data
        await ValidatedModel.insertOrUpdate({
          data: { id: 2, name: 'John Doe', age: 'invalid' },
        });
      } catch (error: any) {
        console.error('InsertOrUpdate Error:', error.message);
      }

      // Check state
      console.log('Store:', ValidatedModel.store);
    };

    runTests();
  }, []);

  return <div data-testid="state">{JSON.stringify(state)}</div>;
};

test('Invalid data handling for ValidatedModel', async () => {
  const { getByTestId } = render(
    <StoreProvider>
      <InvalidDataHandlingComponent />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = JSON.parse(getByTestId('state').textContent || '{}');
    expect(state.validated).toBeUndefined(); // No valid data should be stored
  });
});

class LargeDataModel extends Model {
  static entity = 'largeData';

  static fields() {
    return {
      id: this.attr(null),
      name: this.attr(''),
    };
  }
}

const LargeDataHandlingComponent: React.FC = () => {
  const state = useStoreState();
  const dispatch = useDispatch();

  React.useEffect(() => {
    LargeDataModel.init(state, dispatch);

    const runTests = async () => {
      const largeDataSet = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }));

      // Bulk create
      await LargeDataModel.create({ data: largeDataSet });

      // Bulk update
      const updatedDataSet = largeDataSet.map((item) => ({
        id: item.id,
        name: `Updated ${item.name}`,
      }));
      await LargeDataModel.insertOrUpdate({ data: updatedDataSet });

      // Bulk delete
      const idsToDelete = largeDataSet.slice(0, 5000).map((item) => item.id);
      await LargeDataModel.delete(idsToDelete);

      // Check state
      console.log('Store:', LargeDataModel.store);
    };

    runTests();
  }, []);

  return <div data-testid="state">{JSON.stringify(state)}</div>;
};

test('Handling large data sets for LargeDataModel', async () => {
  const { getByTestId } = render(
    <StoreProvider>
      <LargeDataHandlingComponent />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = JSON.parse(getByTestId('state').textContent || '{}');
    expect(state.largeData).toHaveLength(5000);
    expect(state.largeData[0].name).toBe('Updated Item 5000');
  });
});

class ResetModel extends Model {
  static entity = 'reset';

  static fields() {
    return {
      id: this.attr(null),
      name: this.attr(''),
    };
  }
}

const StateResetComponent: React.FC = () => {
  const state = useStoreState();
  const dispatch = useDispatch();

  React.useEffect(() => {
    ResetModel.init(state, dispatch);

    const runTests = async () => {
      // Initial insert
      await ResetModel.create({ data: { id: 1, name: 'Initial' } });

      // Check state
      console.log('Initial Store:', ResetModel.store);
    };

    runTests();
  }, []);

  const handleReset = async () => {
    // Reset state
    // ResetModel.init({}, dispatch);
    await ResetModel.reset();

    const runTests = async () => {
      // Re-insert after reset
      await ResetModel.insert({ data: { id: 2, name: 'After Reset' } });

      // Check state
      console.log('Reset Store:', ResetModel.store);
    };

    runTests();
  };

  return (
    <div>
      <div data-testid="state">{JSON.stringify(state)}</div>
      <button data-testid="reset-button" onClick={handleReset}>
        Reset State
      </button>
    </div>
  );
};

test('State reset and re-initialization for ResetModel', async () => {
  const { getByTestId } = render(
    <StoreProvider>
      <StateResetComponent />
    </StoreProvider>,
  );

  await waitFor(() => {
    // const state = Model.store;
    const state = JSON.parse(getByTestId('state').textContent || '{}');
    expect(state.reset).toHaveLength(1);
    expect(state.reset[0].name).toBe('Initial');
  });

  fireEvent.click(getByTestId('reset-button'));

  await waitFor(() => {
    // const state = Model.store;
    const state = JSON.parse(getByTestId('state').textContent || '{}');
    expect(state.reset).toHaveLength(1);
    expect(state.reset[0].name).toBe('After Reset');
  });
});
