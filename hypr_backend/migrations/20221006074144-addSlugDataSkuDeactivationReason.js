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
    UPDATE sku_deactivation_reason SET slug = "update-po-for-inbound" where id = 1;
    UPDATE sku_deactivation_reason SET slug = "sku-recontinued" where id = 2;
    UPDATE sku_deactivation_reason SET slug = "duplicate" where id = 3;
    UPDATE sku_deactivation_reason SET slug = "incorrect-sku" where id = 4;
    UPDATE sku_deactivation_reason SET slug = "deprecated-discontinued" where id = 5;
    UPDATE sku_deactivation_reason SET slug = "deprecated-change-in-pack-size" where id = 6;
    `,
  );
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
