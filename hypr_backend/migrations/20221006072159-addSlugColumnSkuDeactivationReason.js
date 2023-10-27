'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.runSql(
    `alter table sku_deactivation_reason add column slug varchar(255) not null;`,
  );
};

exports.down = function(db) {
  return db.runSql(
    `alter table sku_deactivation_reason drop column slug;`
  );
};

exports._meta = {
  "version": 1
};
