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
    "customers",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      name: { type: "string", defaultValue: null },
      address: { type: "string", defaultValue: null },
      phone: { type: "string", defaultValue: null },
      email: { type: "string", defaultValue: null },
      cnic: { type: "string", defaultValue: null },
      verification_code: { type: "int" },
      verified_at: { type: "datetime", defaultValue: null },
      pin_code: { type: "string" },
      cnic_picture: { type: "string", defaultValue: null },
      terms_accepted: { type: "boolean", defaultValue: 0 },
      customer_location: { type: "string", defaultValue: null }, // stringified JSON
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    (err) => {
      if (err) console.log("ERROR AT CREATE CUSTOMER", err);
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
