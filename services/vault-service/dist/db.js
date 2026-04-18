'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, '__esModule', { value: true });
const mongodb_1 = require('mongodb');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'secure-vault';
let client;
function connectDB() {
  return __awaiter(this, void 0, void 0, function* () {
    if (client) {
      return client.db(DB_NAME);
    }
    try {
      client = new mongodb_1.MongoClient(MONGO_URI);
      yield client.connect();
      console.log('Connected to MongoDB');
      return client.db(DB_NAME);
    } catch (error) {
      console.error('Error connecting to MongoDB', error);
      process.exit(1);
    }
  });
}
exports.default = connectDB;
