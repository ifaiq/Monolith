'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

const TABLE_NAME = 'delivery_batch_statuses';

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async (db) => {
  await db.runSql(`INSERT INTO ${TABLE_NAME} (id, name, created_at, updated_at) VALUES (6, 'CLOSED', now(), now())`, []);
  return Promise.resolve(); 
};

exports.down = (db) => null;

exports._meta = {
  "version": 1
};
