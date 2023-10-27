'use strict';

let dbm;
let type;
let seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

const TABLE_NAME = 'products';
const COLUMN_NAME = 'tax_category';

exports.setup = (options, seedLink) => {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.addColumn(TABLE_NAME, COLUMN_NAME, {type: type.INTEGER});
  return Promise.resolve();
};

exports.down = async db => {
  await db.removeColumn(TABLE_NAME, COLUMN_NAME);
  return null;
};

exports._meta = {
  "version": 1
};
