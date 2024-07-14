import { render, waitFor } from '@testing-library/react';
import { Model } from '../src/Model';
import { useDispatch, useStoreState, StoreProvider } from '../src/ModelContext';
import { useEffect } from 'react';

class Client extends Model {
  static entity = 'clients';

  static fields() {
    return {
      id: this.attr(null),
      name: this.attr(''),
    };
  }
}

class InvoiceRow extends Model {
  static entity = 'invoiceRows';

  static fields() {
    return {
      id: this.attr(null),
      order: this.attr(0),
      invoiceId: this.attr(null),
      taxes: this.hasMany(Tax, 'invoiceRowId'),
      invoice: this.belongsTo(Invoice, 'invoiceId'),
    };
  }
}

class Tax extends Model {
  static entity = 'taxes';

  static fields() {
    return {
      id: this.attr(null),
      value: this.attr(0),
      invoiceRowId: this.attr(null),
      invoiceRow: this.belongsTo(InvoiceRow, 'invoiceRowId'),
    };
  }
}

class Invoice extends Model {
  static entity = 'invoices';

  static fields() {
    return {
      id: this.attr(null),
      name: this.attr(''),
      clientId: this.attr(null),
      client: this.belongsTo(Client, 'clientId'),
      rows: this.hasMany(InvoiceRow, 'invoiceId'),
    };
  }
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
    // Initialize Model with the dispatch function and state
    modelClass.init(state, dispatch);

    const executeMethod = async () => {
      await modelClass[method](payload);
    };
    executeMethod();
  }, [method, payload, modelClass]);

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

test('Query should load related models with orderBy', async () => {
  const clientPayload = { data: { id: 1, name: 'Client 1' } };
  const invoicePayload = { data: { id: 1, name: 'Invoice 1', clientId: 1 } };
  const invoiceRowPayload = {
    data: [
      { id: 1, order: 2, invoiceId: 1 },
      { id: 2, order: 1, invoiceId: 1 },
    ],
  };
  const taxPayload = { data: { id: 1, value: 10, invoiceRowId: 1 } };

  const { rerender } = render(
    <StoreProvider>
      <TestComponent
        payload={clientPayload}
        method="create"
        modelClass={Client}
      />
    </StoreProvider>,
  );

  rerender(
    <StoreProvider>
      <TestComponent
        payload={invoicePayload}
        method="create"
        modelClass={Invoice}
      />
    </StoreProvider>,
  );

  rerender(
    <StoreProvider>
      <TestComponent
        payload={invoiceRowPayload}
        method="create"
        modelClass={InvoiceRow}
      />
    </StoreProvider>,
  );

  rerender(
    <StoreProvider>
      <TestComponent payload={taxPayload} method="create" modelClass={Tax} />
    </StoreProvider>,
  );

  await waitFor(() => {
    const invoice = Invoice.query()
      .with(['client', 'rows.taxes'])
      .with('rows', (query) => query.orderBy('order', 'asc'))
      .find(1);

    expect(invoice).toBeDefined();
    if (!invoice) return;
    expect(invoice.client).toBeDefined();
    expect(invoice.client.name).toBe('Client 1');
    expect(invoice.rows.length).toBe(2);
    expect(invoice.rows[0].order).toBe(1); // Ensure order is correct
    expect(invoice.rows[1].order).toBe(2);
    expect(invoice.rows[1].taxes.length).toBe(1);
    expect(invoice.rows[1].taxes[0].value).toBe(10);
  });
});
