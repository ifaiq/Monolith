'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */

let tableName = 'products';

exports.setup = (options, seedLink) => {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async db => {
  await db.runSql(
    `ALTER TABLE products CHANGE COLUMN market_price mrp decimal(10,2); 
    ALTER TABLE catalogue_products CHANGE COLUMN market_price mrp decimal(10,2);`, []);
  return Promise.resolve();
};

exports.down = async db => {
  await db.runSql(
    `ALTER TABLE products CHANGE COLUMN mrp market_price decimal(10,2);
    ALTER TABLE catalogue_products CHANGE COLUMN mrp market_price decimal(10,2);`, []);
  return null;
};

exports._meta = {
  "version": 1
};
