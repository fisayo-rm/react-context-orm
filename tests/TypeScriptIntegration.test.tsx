import { render, waitFor } from '@testing-library/react';
import { Model } from '../src/Model';
import { StoreProvider } from '../src/ModelContext';
import React, { useEffect } from 'react';
import { useStoreState, useDispatch } from '../src/context';

class TestModel extends Model {
  static entity = 'test';

  static fields() {
    return {
      id: this.attr(null),
      name: this.attr(''),
      value: this.attr(0),
      relatedModelId: this.attr(null),
      relatedModel: this.belongsTo(RelatedModel, 'relateModelId'),
    };
  }

  get computed() {
    return this.value * 2;
  }

  set computed(val: number) {
    this.value = val / 2;
  }
}

class RelatedModel extends Model {
  static entity = 'related';

  static fields() {
    return {
      id: this.attr(null),
      name: this.attr(''),
      testModels: this.hasMany(TestModel, 'relatedModelId'),
    };
  }
}

const TestComponent: React.FC = () => {
  const state = useStoreState();
  const dispatch = useDispatch();

  useEffect(() => {
    const runTests = async () => {
      // Initialize models with dispatch and state
      TestModel.init(state, dispatch);
      RelatedModel.init(state, dispatch);

      // Create instances
      await TestModel.create({
        data: { id: 1, name: 'Test', value: 5, relatedModelId: 1 },
      });
      await RelatedModel.create({ data: { id: 1, name: 'Related' } });

      const testInstance = TestModel.query().with('relatedModel').find(1);

      // Verify getters and setters
      expect(testInstance).toBeDefined();
      if (testInstance) {
        expect(testInstance.computed).toBe(10);
        testInstance.computed = 20;
        expect(testInstance.value).toBe(10);
      }
    };

    runTests();
  }, []);

  return (
    <div data-testid="state">
      {JSON.stringify(state, (key, value) =>
        value instanceof Model ? value.toObject() : value,
      )}
    </div>
  );
};

test('Typescript integration should work correctly', async () => {
  const { getByTestId } = render(
    <StoreProvider>
      <TestComponent />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = getByTestId('state').textContent;
    expect(state).toContain('Test');
    expect(state).toContain('Related');
  });
});
