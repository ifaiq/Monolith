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
    "product_audit_history",
    "reason",
    { type: "string", defaultValue: null },
    (err) => {
      if (err) console.log("ERROR AT ADDING reason COLUMN IN product_audit_history -> ", err);
    }
  );
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
