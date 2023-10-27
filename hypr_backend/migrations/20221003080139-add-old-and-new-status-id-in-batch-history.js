'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

const TABLE_NAME = "batch_history";
const OLD_STATUS_ID = "old_status_id";
const NEW_STATUS_ID = "new_status_id";

exports.up = async function (db) {
  // await db.addColumn(TABLE_NAME, OLD_STATUS_ID,
  //   { type: type.INTEGER, defaultValue: null },
  //   err => {
  //     if (err) {
  //       return console.log(
  //         "An error occurred while adding old_status_id column to batch_history", err);
  //     }
  //     return Promise.resolve();
  //   },
  // );
  // await db.addColumn(TABLE_NAME, NEW_STATUS_ID,
  //   { type: type.INTEGER, defaultValue: null },
  //   err => {
  //     if (err) {
  //       return console.log(
  //         "An error occurred while adding new_status_id column to batch_history", err);
  //     }
  //     return Promise.resolve();
  //   },
  // );
  return null;
};

exports.down = async (db) => {
  await db.removeColumn(TABLE_NAME, OLD_STATUS_ID);
  await db.removeColumn(TABLE_NAME, NEW_STATUS_ID);
  return Promise.resolve();
};

exports._meta = {
  "version": 1
};
