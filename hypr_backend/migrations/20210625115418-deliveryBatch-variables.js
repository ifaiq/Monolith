'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
const TABLE_NAME = 'delivery_batches';

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async (db) => {
  await db.addColumn(TABLE_NAME, 'deposit_amount', { type: type.DECIMAL, precision: 10, scale: 2, defaultValue: 0.0 });
  await db.addColumn(TABLE_NAME, 'deposit_type', { type: type.INTEGER, defaultValue: null });
  await db.addColumn(TABLE_NAME, 'deposit_reason', { type: type.INTEGER, defaultValue: null });
  return Promise.resolve();
};

exports.down = async (db) => {
  await db.removeColumn(TABLE_NAME, 'deposit_amount');
  await db.removeColumn(TABLE_NAME, 'deposit_type');
  await db.removeColumn(TABLE_NAME, 'deposit_reason');
  return null;
};

exports._meta = {
  "version": 1
};
