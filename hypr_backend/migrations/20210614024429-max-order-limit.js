
'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

const TABLE_NAME = 'locations';

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.runSql(
    `ALTER TABLE ${TABLE_NAME} CHANGE COLUMN order_limit min_order_limit decimal(10,2);`, []);
  await db.addColumn(TABLE_NAME, 'max_order_limit', { type: "decimal", precision: 10, scale: 2 });
  return Promise.resolve();
};

exports.down = async db => {
  await db.removeColumn(TABLE_NAME, CONTEXT_NAME);
  return null;
};

exports._meta = {
  "version": 1
};