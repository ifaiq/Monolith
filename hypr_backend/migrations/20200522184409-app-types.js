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
    "app_types",
    {
      id: {
        type: "int",
        primaryKey: true,
        autoIncrement: true,
      },
      name: { type: "string", defaultValue: null },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    (err) => {
      if (err) console.log("ERROR AT CREATING APP TYPES", err);
      else {
        /* NOTE: IMPORTANT
        need suggestions on this, @sara, @khizer, we can do auto created/updated at= true for models? 
        but it's neccassary to have created at i guess for better tracking/tracing!
      */
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
