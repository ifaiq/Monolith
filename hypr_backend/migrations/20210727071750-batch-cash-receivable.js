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
  await db.addColumn(TABLE_NAME, 'cash_receivable', { type: type.DECIMAL, precision: 10, scale: 2 });
  await db.addColumn(TABLE_NAME, 'inventory_shortage_amount', { type: type.DECIMAL, precision: 10, scale: 2 });


  return Promise.resolve();
};

exports.down = async (db) => {
  await db.removeColumn(TABLE_NAME, 'cash_receivable');
  await db.removeColumn(TABLE_NAME, 'inventory_shortage_amount');
  return null;
};

exports._meta = {
  "version": 1
};
