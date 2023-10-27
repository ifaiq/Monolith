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

const TABLE_NAME = "order_status_history";
const UPDATED_BY = "updated_by";
const UPDATED_BY_ROLE = "updated_by_role";

exports.up = async (db) => {
  await db.addColumn(TABLE_NAME, UPDATED_BY,
    { type: type.INTEGER, defaultValue: null },
    err => {
      if (err) {
        return console.log(
          "An error occurred while adding updated_by column to order_status_history", err);
      }
      return Promise.resolve();
    },
  );
  await db.addColumn(TABLE_NAME, UPDATED_BY_ROLE,
    { type: type.STRING, defaultValue: null },
    err => {
      if (err) {
        return console.log(
          "An error occurred while adding updated_by_role column to order_status_history", err);
      }
      return Promise.resolve();
    },
  );
};

exports.down = async (db) => {
  await db.removeColumn(TABLE_NAME, UPDATED_BY);
  await db.removeColumn(TABLE_NAME, UPDATED_BY_ROLE);
  return Promise.resolve();
};

exports._meta = {
  "version": 1
};
