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


exports.up = function (db) {
  return db.runSql(`
  INSERT INTO sku_deactivation_reason(reason,type) VALUES("Update PO for Inbound",'ENABLED');
  INSERT INTO sku_deactivation_reason(reason,type) VALUES("SKU Recontinued",'ENABLED');
  INSERT INTO sku_deactivation_reason(reason,type) VALUES("Duplicate",'DISABLED');
  INSERT INTO sku_deactivation_reason(reason,type) VALUES("Incorrect SKU",'DISABLED');
  INSERT INTO sku_deactivation_reason(reason,type) VALUES("Deprecated (discontinued)",'DISABLED');
  INSERT INTO sku_deactivation_reason(reason,type) VALUES("Deprecated (change in pack size)",'DISABLED');
  `);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
