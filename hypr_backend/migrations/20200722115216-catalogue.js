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
    "catalogue",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      name: { type: "string", defaultValue: null, length: "1000" },
      company_id: {
        type: "int",
        foreignKey: {
          name: "catalogue_company_id_fk",
          table: "companies",
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
    (err) => {
      if (err) console.log("ERROR AT CREATE PRODUCT", err);
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
