import { Model } from '../src/Model';

class TestModel extends Model {
  static static = 'test';
  id!: number;
  name!: string;

  static fields() {
    return {
      id: this.attr(null),
      name: this.attr(''),
    };
  }
}

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

test('Model should dispatch create action with payload', () => {
  const payload = { id: 1, name: 'test' };
  const result = TestModel.create(payload);
  expect(result).toEqual({ action: 'create', payload });
});
