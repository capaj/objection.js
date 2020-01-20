'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const objection_1 = require('objection');
const path_1 = require('path');
class Animal extends objection_1.Model {}
// Table name is the only required property.
Animal.tableName = 'animals';
// Optional JSON schema. This is not the database schema! Nothing is generated
// based on this. This is only used for validation. Whenever a model instance
// is created it is checked against this schema. http://json-schema.org/.
Animal.jsonSchema = {
  type: 'object',
  required: ['name'],
  properties: {
    id: { type: 'integer' },
    ownerId: { type: ['integer', 'null'] },
    name: { type: 'string', minLength: 1, maxLength: 255 },
    species: { type: 'string', minLength: 1, maxLength: 255 }
  }
};
// This object defines the relations to other models.
Animal.relationMappings = {
  owner: {
    relation: objection_1.Model.BelongsToOneRelation,
    // The related model. This can be either a Model subclass constructor or an
    // absolute file path to a module that exports one. We use the file path version
    // here to prevent require loops.
    modelClass: path_1.join(__dirname, 'Person'),
    join: {
      from: 'animals.ownerId',
      to: 'persons.id'
    }
  }
};
exports.default = Animal;
