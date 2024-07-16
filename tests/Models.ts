import { Model } from '../src/Model';

export class User extends Model {
  static entity = 'users';

  static fields() {
    return {
      id: this.attr(null),
      name: this.attr(''),
      posts: this.hasMany(Post, 'userId'),
    };
  }
}

export class Post extends Model {
  static entity = 'posts';

  static fields() {
    return {
      id: this.attr(null),
      userId: this.attr(null),
      title: this.attr(''),
      comments: this.hasMany(Comment, 'postId'),
    };
  }
}

export class Comment extends Model {
  static entity = 'comments';

  static fields() {
    return {
      id: this.attr(null),
      postId: this.attr(null),
      content: this.attr(''),
    };
  }
}
