/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
"use strict";

let dbm;
let type;
let seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

const TABLE_NAME = "orders";
const COLUMN_NAME = "volume_based_discount";

exports.up = async function (db) {
  await db.addColumn(TABLE_NAME, COLUMN_NAME,
    { type: type.DECIMAL, defaultValue: 0.0, precision: 10, scale: 2 },
    err => {
      if (err) {
        return console.log(
          "An error occurred while adding volume_based_discount column to orders", err);
      }
      return Promise.resolve();
    },
  );
};

exports.down = async function (db) {
  await db.removeColumn(TABLE_NAME, COLUMN_NAME);
  return Promise.resolve();
};

exports._meta = {
  version: 1,
};
