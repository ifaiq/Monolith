"use strict";

var dbm;
var type;
var seed;

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
  return db.createTable(
    "app_versions",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      name: "string",
      current_version: "string",
      updated_by: {
        type: "int",
        foreignKey: {
          name: "app_versions_user_id_fk",
          table: "users",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    function () {}
  );
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
