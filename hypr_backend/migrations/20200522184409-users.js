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
    "users",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      name: { type: "string", defaultValue: null },
      address: { type: "string", defaultValue: null },
      phone: { type: "string", defaultValue: null },
      email: { type: "string", defaultValue: null },
      cnic: { type: "string", defaultValue: null },
      cnic_picture: { type: "string", defaultValue: null },
      username: { type: "string", defaultValue: null },
      password: { type: "string", defaultValue: null },
      disabled: { type: "boolean", defaultValue: 0 },
      deleted_by: { type: "int" },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    (err) => {
      if (err) console.log("ERROR AT CREATE USER", err);
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
