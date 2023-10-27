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
    "account_settings",
    {
      id: { type: "int", autoIncrement: true, primaryKey: true },
      currency: { type: "string", defaultValue: null },
      language: { type: "string", defaultValue: null },
      company_id: {
        type: "int",
        foreignKey: {
          name: "account_settings_company_id_fk",
          table: "companies",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      send_events: { type: "boolean", defaultValue: 0 },
      app_type: {
        type: "int",
        foreignKey: {
          name: "app_type_fk",
          table: "app_types",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      shipment_method: {
        type: "int",
        foreignKey: {
          name: "account_settings_shipment_method_fk",
          table: "shipment_methods",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      service_charge_type: { type: "string", defaultValue: null },
      service_charge_value: { type: type.DECIMAL, defaultValue: 0.0 },
      delivery_charge_type: { type: "string", defaultValue: null },
      delivery_charge_value: { type: type.DECIMAL, defaultValue: 0.0 },
      disabled_at: { type: "datetime", defaultValue: null },
      disabled_by: { type: "int", defaultValue: null },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    (err) => {
      if (err) console.log("ERROR AT CREATING ACCOUNT SETTINGS", err);
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
