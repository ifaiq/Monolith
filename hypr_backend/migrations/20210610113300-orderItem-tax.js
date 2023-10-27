'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
const TABLE_NAME = 'order_items';
const COLUMN_NAME = 'tax';
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.runSql(
    `ALTER TABLE ${TABLE_NAME} ADD COLUMN ${COLUMN_NAME} DECIMAL(10,2) DEFAULT 0.00`, []);
  return Promise.resolve();
};

exports.down = async db => {
  await db.removeColumn(TABLE_NAME, COLUMN_NAME);
  return null;
};

exports._meta = {
  "version": 1
};
