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
    "companies",
    "type",
    { type: "string", defaultValue: "B2C" },
    function (err) {
      if (err) {
        console.log(err);
      } else {
        return db.runSql(
          "UPDATE companies set type='B2B' where code = 'RET'",
          [],
          function (err) {
            if (err) console.log(err);
          }
        );
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
