'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : new P(function(resolve) {
              resolve(result.value);
            }).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, '__esModule', { value: true });
const objection_1 = require('objection');
const Person_1 = require('./models/Person');
const Animal_1 = require('./models/Animal');
const Movie_1 = require('./models/Movie');
exports.default = router => {
  // Create a new Person. Because we use `insertGraph` you can pass relations
  // with the person and they also get inserted and related to the person. If
  // all you want to do is insert a single person, `insertGraph` and `allowInsert`
  // can be replaced by `insert(req.body)`.
  router.post('/persons', (req, res) =>
    __awaiter(this, void 0, void 0, function*() {
      const graph = req.body;
      // It's a good idea to wrap `insertGraph` call in a transaction since it
      // may create multiple queries.
      const insertedGraph = yield objection_1.transaction(Person_1.default.knex(), trx => {
        return (
          Person_1.default
            .query(trx)
            // For security reasons, limit the relations that can be inserted.
            .allowInsert('[pets, children.[pets, movies], movies, parent]')
            .insertGraph(graph)
        );
      });
      res.send(insertedGraph);
    })
  );
  // Patch a Person.
  router.patch('/persons/:id', (req, res) =>
    __awaiter(this, void 0, void 0, function*() {
      const person = yield Person_1.default.query().patchAndFetchById(req.params.id, req.body);
      res.send(person);
    })
  );
  // Patch a person and upsert its relations.
  router.patch('/persons/:id/upsert', (req, res) =>
    __awaiter(this, void 0, void 0, function*() {
      const graph = req.body;
      // Make sure only one person was sent.
      if (Array.isArray(graph)) {
        throw createStatusCodeError(400);
      }
      // Make sure the person has the correct id because `upsertGraph` uses the id fields
      // to determine which models need to be updated and which inserted.
      graph.id = parseInt(req.params.id, 10);
      // It's a good idea to wrap `upsertGraph` call in a transaction since it
      // may create multiple queries.
      const upsertedGraph = yield objection_1.transaction(Person_1.default.knex(), trx => {
        return (
          Person_1.default
            .query(trx)
            // For security reasons, limit the relations that can be upserted.
            .allowUpsert('[pets, children.[pets, movies], movies, parent]')
            .upsertGraph(graph)
        );
      });
      res.send(upsertedGraph);
    })
  );
  // Get multiple Persons. The result can be filtered using query parameters
  // `minAge`, `maxAge` and `firstName`. Relations can be fetched eagerly
  // by giving a relation expression as the `eager` query parameter.
  router.get('/persons', (req, res) =>
    __awaiter(this, void 0, void 0, function*() {
      // We don't need to check for the existence of the query parameters because
      // we call the `skipUndefined` method. It causes the query builder methods
      // to do nothing if one of the values is undefined.
      const persons = yield Person_1.default
        .query()
        .skipUndefined()
        // For security reasons, limit the relations that can be fetched.
        .allowEager('[pets, parent, children.[pets, movies.actors], movies.actors.pets]')
        .eager(req.query.eager)
        .where('age', '>=', req.query.minAge)
        .where('age', '<', req.query.maxAge)
        .where('firstName', 'like', req.query.firstName)
        .orderBy('firstName')
        // Order eagerly loaded pets by name.
        .modifyEager('[pets, children.pets]', qb => qb.orderBy('name'));
      res.send(persons);
    })
  );
  // Get a single person.
  router.get('/persons/:id', (req, res) =>
    __awaiter(this, void 0, void 0, function*() {
      const person = yield Person_1.default.query().findById(req.params.id);
      res.send(person);
    })
  );
  // Delete a person.
  router.delete('/persons/:id', (req, res) =>
    __awaiter(this, void 0, void 0, function*() {
      const count = yield Person_1.default.query().deleteById(req.params.id);
      res.send({ dropped: count === 1 });
    })
  );
  // Add a child for a Person.
  router.post('/persons/:id/children', (req, res) =>
    __awaiter(this, void 0, void 0, function*() {
      const person = yield Person_1.default.query().findById(req.params.id);
      if (!person) {
        throw createStatusCodeError(404);
      }
      const child = yield person.$relatedQuery('children').insert(req.body);
      res.send(child);
    })
  );
  // Add a pet for a Person.
  router.post('/persons/:id/pets', (req, res) =>
    __awaiter(this, void 0, void 0, function*() {
      const person = yield Person_1.default.query().findById(req.params.id);
      if (!person) {
        throw createStatusCodeError(404);
      }
      const pet = yield person.$relatedQuery('pets').insert(req.body);
      res.send(pet);
    })
  );
  // Get a Person's pets. The result can be filtered using query parameters
  // `name` and `species`.
  router.get('/persons/:id/pets', (req, res) =>
    __awaiter(this, void 0, void 0, function*() {
      const person = yield Person_1.default.query().findById(req.params.id);
      if (!person) {
        throw createStatusCodeError(404);
      }
      // We don't need to check for the existence of the query parameters because
      // we call the `skipUndefined` method. It causes the query builder methods
      // to do nothing if one of the values is undefined.
      const pets = yield person
        .$relatedQuery('pets')
        .skipUndefined()
        .where('name', 'like', req.query.name)
        .where('species', req.query.species);
      res.send(pets);
    })
  );
  // Add a movie for a Person.
  router.post('/persons/:id/movies', (req, res) =>
    __awaiter(this, void 0, void 0, function*() {
      // Inserting a movie for a person creates two queries: the movie insert query
      // and the join table row insert query. It is wise to use a transaction here.
      const movie = yield objection_1.transaction(Person_1.default.knex(), function(trx) {
        return __awaiter(this, void 0, void 0, function*() {
          const person = yield Person_1.default.query(trx).findById(req.params.id);
          if (!person) {
            throw createStatusCodeError(404);
          }
          return person.$relatedQuery('movies', trx).insert(req.body);
        });
      });
      res.send(movie);
    })
  );
  // Get a person's movies.
  router.get('/persons/:id/movies', (req, res) =>
    __awaiter(this, void 0, void 0, function*() {
      const person = yield Person_1.default.query().findById(req.params.id);
      if (!person) {
        throw createStatusCodeError(404);
      }
      const movies = yield person.$relatedQuery('movies');
      res.send(movies);
    })
  );
  // Get a single pet.
  router.get('/pets/:id', (req, res) =>
    __awaiter(this, void 0, void 0, function*() {
      const pet = yield Animal_1.default.query().findById(req.params.id);
      res.send(pet);
    })
  );
  // Add existing Person as an actor to a movie.
  router.post('/movies/:id/actors', (req, res) =>
    __awaiter(this, void 0, void 0, function*() {
      const movie = yield Movie_1.default.query().findById(req.params.id);
      if (!movie) {
        throw createStatusCodeError(404);
      }
      yield movie.$relatedQuery('actors').relate(req.body.id);
      res.send(req.body);
    })
  );
  // Get Movie's actors.
  router.get('/movies/:id/actors', (req, res) =>
    __awaiter(this, void 0, void 0, function*() {
      const movie = yield Movie_1.default.query().findById(req.params.id);
      if (!movie) {
        throw createStatusCodeError(404);
      }
      const actors = yield movie.$relatedQuery('actors');
      res.send(actors);
    })
  );
  // Get a single movie.
  router.get('/movies/:id', (req, res) =>
    __awaiter(this, void 0, void 0, function*() {
      const movie = yield Movie_1.default.query().findById(req.params.id);
      res.send(movie);
    })
  );
};
// The error returned by this function is handled in the error handler middleware in app.js.
function createStatusCodeError(statusCode) {
  return Object.assign(new Error(), {
    statusCode
  });
}
