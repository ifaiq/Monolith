'use strict';

var dbm;
var type;
var seed;

const TABLE_NAME = 'batch_performances';

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.runSql(`ALTER TABLE ${TABLE_NAME} MODIFY COLUMN delivered_gmv decimal(10, 2);`, []);
  await db.runSql(`ALTER TABLE ${TABLE_NAME} MODIFY COLUMN total_gmv decimal(10, 2);`, []);
};

exports.down = async db => {
  await db.runSql(`ALTER TABLE ${TABLE_NAME} MODIFY COLUMN delivered_gmv int;`, []);
  await db.runSql(`ALTER TABLE ${TABLE_NAME} MODIFY COLUMN total_gmv int;`, []);
};

exports._meta = {
  version: 1,
};
