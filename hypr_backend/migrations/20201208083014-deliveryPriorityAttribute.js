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
    "orders",
    "delivery_priority",
    { type: "int", defaultValue: null },
    (err) => {
      if (err)
        console.log("ERROR AT ADDING delivery_priority COLUMN IN orders");
      else {
        console.log("Column delivery_priority inserted successfully in orders");
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
