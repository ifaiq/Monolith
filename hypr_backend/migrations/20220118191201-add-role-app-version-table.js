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
  return db.createTable(
    "roles_app_versions",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      role_id: {
        type: "int",
        foreignKey: {
          name: "roles_appversion_fk",
          table: "roles",
          rules: {
            onDelete: "CASCADE",
          },
          mapping: "id",
        },
      },
      os: { type: "string", defaultValue: true },
      minimum_version: { type: "string", defaultValue: true },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    (err) => {
      if (err) {
        console.log("ERROR AT CREATING ROLES APP_VERSION TABLE");
      }
    }
  );
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
