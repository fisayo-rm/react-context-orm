import { render, waitFor } from '@testing-library/react';
import { StoreProvider } from '../src/ModelContext';
import { useStoreState, useDispatch } from '../src/context';
import React from 'react';
import { Model } from '../src/Model';

class HydrateModel extends Model {
  static entity = 'hydrateTest';

  static fields() {
    return {
      id: this.attr(null),
      value: this.attr(''),
    };
  }
}

const HydrateTestComponent: React.FC<{
  hydrateState?: any;
}> = ({ hydrateState }) => {
  const state = useStoreState();
  const dispatch = useDispatch();

  React.useEffect(() => {
    HydrateModel.init(state, dispatch);
    if (hydrateState) {
      HydrateModel.init(hydrateState, dispatch);
    }
  }, [state, dispatch, hydrateState]);

  return <div data-testid="state">{JSON.stringify(state)}</div>;
};

test('Model.init hydrates context state when state is different', async () => {
  const initialState = { hydrateTest: [{ id: 1, value: 'A' }] };
  const hydrateState = { hydrateTest: [{ id: 2, value: 'B' }] };

  const { getByTestId, rerender } = render(
    <StoreProvider initialState={initialState}>
      <HydrateTestComponent />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = JSON.parse(getByTestId('state').textContent || '{}');
    expect(state.hydrateTest[0].id).toBe(1);
    expect(state.hydrateTest[0].value).toBe('A');
  });

  // Hydrate with new state
  rerender(
    <StoreProvider initialState={initialState}>
      <HydrateTestComponent hydrateState={hydrateState} />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = JSON.parse(getByTestId('state').textContent || '{}');
    expect(state.hydrateTest[0].id).toBe(2);
    expect(state.hydrateTest[0].value).toBe('B');
  });
});

test('Model.init does not hydrate if state is unchanged', async () => {
  const initialState = { hydrateTest: [{ id: 1, value: 'A' }] };

  const { getByTestId } = render(
    <StoreProvider initialState={initialState}>
      <HydrateTestComponent hydrateState={initialState} />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = JSON.parse(getByTestId('state').textContent || '{}');
    expect(state.hydrateTest[0].id).toBe(1);
    expect(state.hydrateTest[0].value).toBe('A');
  });
});

test('Hydrate mutation replaces state, not merges', async () => {
  const initialState = {
    hydrateTest: [{ id: 1, value: 'A' }],
    other: [{ id: 99 }],
  };
  const hydrateState = { hydrateTest: [{ id: 2, value: 'B' }] };

  const { getByTestId, rerender } = render(
    <StoreProvider initialState={initialState}>
      <HydrateTestComponent />
    </StoreProvider>,
  );

  rerender(
    <StoreProvider initialState={initialState}>
      <HydrateTestComponent hydrateState={hydrateState} />
    </StoreProvider>,
  );

  await waitFor(() => {
    const state = JSON.parse(getByTestId('state').textContent || '{}');
    expect(state.hydrateTest[0].id).toBe(2);
    expect(state.other).toBeUndefined();
  });
});
