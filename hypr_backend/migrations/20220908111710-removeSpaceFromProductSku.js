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

exports.up = async db => {
  db.runSql(`
  START TRANSACTION;
  SET SQL_SAFE_UPDATES = 0;
  UPDATE products SET sku = replace(sku,' ','');
  SET SQL_SAFE_UPDATES = 1;
  COMMIT;
  `);
  return Promise.resolve();
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
