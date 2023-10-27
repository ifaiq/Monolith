'use strict';

let dbm;
let type;
let seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */

// TODO Need to create constants for table and columns.
let tablename = 'products';

exports.setup = (options, seedLink) => {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.addColumn(tablename, 'weight', { type: type.DECIMAL, precision: 10, scale: 3, defaultValue: 0.0 });
  await db.addColumn(tablename, 'height', { type: type.DECIMAL, precision: 10, scale: 3, defaultValue: 0.0 });
  await db.addColumn(tablename, 'length', { type: type.DECIMAL, precision: 10, scale: 3, defaultValue: 0.0 });
  await db.addColumn(tablename, 'width', { type: type.DECIMAL, precision: 10, scale: 3, defaultValue: 0.0 });
  return Promise.resolve();
};

exports.down = async db => {
  await db.removeColumn(tablename, 'weight');
  await db.removeColumn(tablename, 'height');
  await db.removeColumn(tablename, 'length');
  await db.removeColumn(tablename, 'width');
  return null;
};

exports._meta = {
  "version": 1
};
