'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const objection_1 = require('objection');
class Person extends objection_1.Model {
  examplePersonMethod(arg) {
    return 1;
  }
  //
  // Example of numeric timestamps. Presumably this would be in a base
  // class or a mixin, and not just one of your leaf models.
  //
  $beforeInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
  $beforeUpdate() {
    this.updatedAt = new Date();
  }
  $parseDatabaseJson(json) {
    json = super.$parseDatabaseJson(json);
    toDate(json, 'createdAt');
    toDate(json, 'updatedAt');
    return json;
  }
  $formatDatabaseJson(json) {
    json = super.$formatDatabaseJson(json);
    toTime(json, 'createdAt');
    toTime(json, 'updatedAt');
    return json;
  }
}
// Table name is the only required property.
Person.tableName = 'persons';
// Optional JSON schema. This is not the database schema! Nothing is generated
// based on this. This is only used for validation. Whenever a model instance
// is created it is checked against this schema. http://json-schema.org/.
Person.jsonSchema = {
  type: 'object',
  required: ['firstName', 'lastName'],
  properties: {
    id: { type: 'integer' },
    parentId: { type: ['integer', 'null'] },
    firstName: { type: 'string', minLength: 1, maxLength: 255 },
    lastName: { type: 'string', minLength: 1, maxLength: 255 },
    age: { type: 'number' },
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        zipCode: { type: 'string' }
      }
    }
  }
};
// Where to look for models classes.
Person.modelPaths = [__dirname];
// This object defines the relations to other models. The modelClass strings
// will be joined to `modelPaths` to find the class definition, to avoid
// require loops. The other solution to avoid require loops is to make
// relationMappings a thunk. See Movie.ts for an example.
Person.relationMappings = {
  pets: {
    relation: objection_1.Model.HasManyRelation,
    // This model defines the `modelPaths` property. Therefore we can simply use
    // the model module names in `modelClass`.
    modelClass: 'Animal',
    join: {
      from: 'persons.id',
      to: 'animals.ownerId'
    }
  },
  movies: {
    relation: objection_1.Model.ManyToManyRelation,
    modelClass: 'Movie',
    join: {
      from: 'persons.id',
      // ManyToMany relation needs the `through` object to describe the join table.
      through: {
        from: 'persons_movies.personId',
        to: 'persons_movies.movieId'
      },
      to: 'movies.id'
    }
  },
  children: {
    relation: objection_1.Model.HasManyRelation,
    modelClass: Person,
    join: {
      from: 'persons.id',
      to: 'persons.parentId'
    }
  },
  parent: {
    relation: objection_1.Model.BelongsToOneRelation,
    modelClass: Person,
    join: {
      from: 'persons.parentId',
      to: 'persons.id'
    }
  }
};
exports.default = Person;
function toDate(obj, fieldName) {
  if (obj != null && typeof obj[fieldName] === 'number') {
    obj[fieldName] = new Date(obj[fieldName]);
  }
  return obj;
}
function toTime(obj, fieldName) {
  if (obj != null && obj[fieldName] != null && obj[fieldName].getTime) {
    obj[fieldName] = obj[fieldName].getTime();
  }
  return obj;
}
