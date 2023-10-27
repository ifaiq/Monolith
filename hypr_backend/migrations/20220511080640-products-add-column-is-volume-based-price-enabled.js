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

const TABLE_NAME = "products";
const COLUMN_NAME = "is_volume_based_price_enabled";

exports.up = async function (db) {
  await db.addColumn(
    TABLE_NAME,
    COLUMN_NAME,
    { type: type.BOOLEAN, defaultValue: false },
    err => {
      if (err) {
        return console.log(
          "An error occurred while adding is_volume_based_price_enabled column to products", err);
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
