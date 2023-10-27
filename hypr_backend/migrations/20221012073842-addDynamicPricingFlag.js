"use strict";

let dbm;
let type;
let seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

const TABLE_NAME = "products";

exports.up = function (db) {
  return db.runSql(`alter table ${TABLE_NAME} add column is_dynamic_price_enabled boolean default false;`);
};

exports.down = function (db) {
  return db.runSql(`alter table ${TABLE_NAME} drop column is_dynamic_price_enabled;`);
};

exports._meta = {
  version: 1,
};
