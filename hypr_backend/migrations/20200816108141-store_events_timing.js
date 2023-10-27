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
    "store_events_timing",
    {
      id: {
        type: "int",
        primaryKey: true,
        autoIncrement: true,
      },
      start_date: { type: "datetime", defaultValue: null },
      end_date: { type: "datetime", defaultValue: null },
      start_time: { type: "string", defaultValue: null },
      end_time: { type: "string", defaultValue: null },
      location_id: {
        type: "int",
        foreignKey: {
          name: "store_events_timing_location_id_fk",
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
      if (err) console.log("ERROR AT CREATING APP TYPES", err);
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
