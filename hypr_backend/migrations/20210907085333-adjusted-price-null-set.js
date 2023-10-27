'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

const TABLE_NAME = 'order_items';

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async (db) => {
  await db.runSql(`update ${TABLE_NAME} set adjusted_price = null, adjusted_tax = null where adjusted_price = 0.00` , []);
  return Promise.resolve();
};

exports.down = async (db) => null;

exports._meta = {
  "version": 1
};
