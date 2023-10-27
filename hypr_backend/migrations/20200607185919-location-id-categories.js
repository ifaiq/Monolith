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
  return db.addForeignKey(
    "categories",
    "locations",
    "location_category_id_fk",
    {
      location_id: "id",
    },
    { onDelete: "CASCADE", onUpdate: "RESTRICT" },
    (err) => {
      if (err)
        console.log(
          "ERROR AT CREATING LOCATION FOREIGN KEY FOR CATEGORIES",
          err
        );
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
