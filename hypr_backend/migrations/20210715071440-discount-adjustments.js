'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

const TABLE_NAME = 'order_items';

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.addColumn(TABLE_NAME, 'discount', { type: type.DECIMAL, precision: 10, scale: 2, defaultValue: 0.00 });
  await db.addColumn(TABLE_NAME, 'adjusted_discount', { type: type.DECIMAL, precision: 10, scale: 2, defaultValue: 0.00 });
  await db.addColumn(TABLE_NAME, 'adjusted_price', { type: type.DECIMAL, precision: 10, scale: 2, defaultValue: 0.00 });
  await db.addColumn(TABLE_NAME, 'adjusted_tax', { type: type.DECIMAL, precision: 10, scale: 2, defaultValue: 0.00 });
  return Promise.resolve();
};

exports.down = async db => {
  await db.removeColumn(TABLE_NAME, 'discount');
  await db.removeColumn(TABLE_NAME, 'adjusted_discount');
  await db.removeColumn(TABLE_NAME, 'adjusted_price');
  await db.removeColumn(TABLE_NAME, 'adjusted_tax');
  return null;
};

exports._meta = {
  "version": 1
};