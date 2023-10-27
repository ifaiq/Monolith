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
    "product_categories_junction",
    "product_priority",
    { type: "int", defaultValue: null },
    (err) => {
      if (err)
        console.log("ERROR AT ADDING product_priority COLUMN IN product_categories_junction");
      else {
        console.log("ADDED product_priority COLUMN IN product_categories_junction");
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
