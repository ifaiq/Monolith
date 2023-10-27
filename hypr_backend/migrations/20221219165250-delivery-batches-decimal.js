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

exports.up = function (db) {
  // type:'decimal', precision: 10, scale: 2
  return db.changeColumn(
    "delivery_batches",
    "inventory_loss",
    { type: "decimal", precision: 10, scale: 2 },
    err => {
      if (err) {
        console.log(err);
      }
      return Promise.resolve();
    },
  );
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
