'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
const TABLE_NAME = 'customers';

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async (db) => {
  await db.addColumn(TABLE_NAME, 'language', { type: type.INTEGER, defaultValue: null });
  return Promise.resolve();
};

exports.down = async (db) => await db.removeColumn(TABLE_NAME, 'language');

exports._meta = {
  "version": 1
};
