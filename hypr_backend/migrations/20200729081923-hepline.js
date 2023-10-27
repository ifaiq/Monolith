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
  return db.addColumn(
    "locations",
    "phone",
    { type: "string", defaultValue: null },
    (err) => {
      if (err) console.log("ERROR AT HELPLINE COLUMN IN LOCATIONS");
      else {
        return db.dropTable("location_contacts", (err) => {
          if (err) {
            console.log("ERROR DROPING location_contacts");
          }
        });
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
