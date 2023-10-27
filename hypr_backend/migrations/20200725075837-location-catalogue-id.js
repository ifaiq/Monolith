'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.addColumn(
    "locations",
    "catalogue_id",
    { type: "int" },
    (err) => {
      if (err) {
        console.log("ERROR AT ADDING CATALOGUE ID COLUMN IN LOCATIONS");
        console.log(err);
      } else {
        return db.addForeignKey(
          "locations",
          "catalogue",
          "location_catalogue_id",
          {
            catalogue_id: "id",
          },
          { onDelete: "CASCADE", onUpdate: "RESTRICT" },
          (err) => {
            if (err)
              console.log(
                "ERROR AT CREATING CATALOGUE ID FOREIGN KEY FOR LOCATIONS",
                err
              );
            else {
            }
          }
        );
      }
    }
  );
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
