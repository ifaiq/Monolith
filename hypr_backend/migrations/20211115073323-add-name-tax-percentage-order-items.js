'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

const TABLE_NAME = 'order_items';
const NAME_COLUMN_NAME = 'name';
const TAX_COLUMN_NAME = 'tax_percentage';

exports.setup = (options, seedLink) => {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async function (db) {
  // await db.addColumn(TABLE_NAME, NAME_COLUMN_NAME, { type: 'string', defaultValue: null });
  // await db.addColumn(TABLE_NAME, TAX_COLUMN_NAME, { type: type.DECIMAL, precision: 10, scale: 2 });
  // return Promise.resolve();
  return null;
};

exports.down = async function (db) {
  // await db.removeColumn(TABLE_NAME, NAME_COLUMN_NAME);
  // await db.removeColumn(TABLE_NAME, TAX_COLUMN_NAME);
  // return Promise.resolve();
  return null;
};

exports._meta = {
  "version": 1
};
