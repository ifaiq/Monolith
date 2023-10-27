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
    "auth_store",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      user_id: {
        type: "int",
        foreignKey: {
          name: "auth_store_user_id_fk",
          table: "users",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      company_id: {
        type: "int",
        foreignKey: {
          name: "auth_store_company_id_fk",
          table: "companies",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      business_unit_id: {
        type: "int",
        foreignKey: {
          name: "auth_store_bu_id_fk",
          table: "business_units",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      location_id: {
        type: "int",
        foreignKey: {
          name: "auth_store_location_id_fk",
          table: "locations",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      disabled: { type: "boolean", defaultValue: 0 },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    (err) => {
      if (err) console.log("ERROR AT CREATE AUTH STORE", err);
      else {
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
