# React ORM Library

## Introduction

React ORM Library is a powerful and flexible ORM (Object-Relational Mapping) library for React applications, enabling easy and efficient data management using models.

## Installation

To install the library, run:

```bash
npm install react-orm-library

```

## Quick Start

Here's a simple example to get you started:

```jsx
import React from 'react';
import {
  Model,
  StoreProvider,
  useStoreState,
  useDispatch,
} from 'react-orm-library';

class User extends Model {
  static entity = 'users';

  static fields() {
    return {
      id: this.attr(null),
      name: this.attr(''),
    };
  }
}

const App = () => {
  const state = useStoreState();
  const dispatch = useDispatch();

  React.useEffect(() => {
    User.init(state, dispatch);
    User.create({ data: { id: 1, name: 'John Doe' } });
  }, [state, dispatch]);

  return (
    <StoreProvider>
      <div>{JSON.stringify(state.users)}</div>
    </StoreProvider>
  );
};

export default App;
```

## Usage

### Models

Define your models by extending the `Model` class:

```jsx
class Post extends Model {
  static entity = 'posts';

  static fields() {
    return {
      id: this.attr(null),
      title: this.attr(''),
      content: this.attr(''),
      userId: this.attr(null),
      user: this.belongsTo(User, 'userId'),
    };
  }
}
```

### CRUD Operations

Perform CRUD operations using the static methods:

```jsx
await User.create({ data: { id: 1, name: 'John Doe' } });
const user = User.find(1);
await User.update({ data: { id: 1, name: 'Jane Doe' } });
await User.delete(1);
```

### Relationships

Define and query relationships:

```jsx
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

const post = Post.query().with('comments').find(1);
```

### Advanced Topics

### Query Builder

Use the query builder for complex queries:

```jsx
const posts = Post.query()
  .with(['user', 'comments'])
  .orderBy('title', 'asc')
  .all();
```

## Contributing

We welcome contributions! Please read our [contributing guidelines](CONTRIBUTING.md) for more information.

## FAQ

### How do I define relationships between models?

Use `belongsTo` and `hasMany` methods to define relationships in your model fields.

### How do I perform bulk operations?

Use the `create`, `insert`, `update`, and `delete` methods with an array of data.

## License

[MIT License](https://www.notion.so/LICENSE)
