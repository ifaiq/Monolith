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

const TABLE_NAME = "sku_deactivation_reason";

exports.up = function (db) {
  return db.runSql(`create table ${TABLE_NAME}(
    id int primary key auto_increment,
    reason varchar(255) not null,
    type enum ('ENABLED','DISABLED'),
    created_at datetime not null default current_timestamp,
    updated_at datetime on update current_timestamp,
    deleted_at datetime
    );`);
};

exports.down = function (db) {
  return db.dropTable(TABLE_NAME);
};

exports._meta = {
  version: 1,
};
