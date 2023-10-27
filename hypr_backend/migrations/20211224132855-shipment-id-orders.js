'use strict';

var dbm;
var type;
var seed;

const TABLE_NAME = 'orders';
const COLUMN_NAME = 'shipment_id';

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async function (db) {
  // await db.addColumn(TABLE_NAME, COLUMN_NAME, { type: type.STRING, defaultValue: null });
  // return Promise.resolve();
  return null;
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  "version": 1
};
