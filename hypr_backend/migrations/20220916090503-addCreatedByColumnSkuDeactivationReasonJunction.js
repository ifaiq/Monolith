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
  return db.runSql(
    `alter table sku_deactivation_reason_junction add column created_by varchar(255) not null;`,
  );
};

exports.down = function (db) {
  return db.runSql(
    `alter table sku_deactivation_reason_junction drop column created_by;`,
  );
};

exports._meta = {
  version: 1,
};
