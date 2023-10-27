'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async (db) => {
  await db.runSql(`UPDATE order_amount_adjustments SET deleted_at = '2022-09-14 017:14:58' WHERE id = 59330;`, []);
  return Promise.resolve();
};

exports.down = async (db) => {
  await db.runSql(`UPDATE order_amount_adjustments SET deleted_at = NULL WHERE id = 59330;`, []);
  return null;
};

exports._meta = {
  "version": 1
};
