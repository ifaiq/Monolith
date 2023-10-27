'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

const table = 'delivery_batches';

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.runSql(`update delivery_batches set status_id = 6 where status_id = 5;`, []);
  return Promise.resolve();
};

exports.down = async db => {
  return null;
};

exports._meta = {
  "version": 1
};