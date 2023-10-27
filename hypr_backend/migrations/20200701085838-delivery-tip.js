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
    "tip_amount",
    { type: type.DECIMAL,defaultValue:0 },
    (err) => {
      if (err)
        console.log("ERROR AT ADDING POST CODE COLUMN IN CUSTOMER ADDRESSES");
      else {
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
