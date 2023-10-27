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
    "account_settings",
    "last_sync",
    { type: "datetime", defaultValue: null },
    function (err) {
      if (err) {
        console.log(err);
      } else {
        return db.runSql(
          "UPDATE account_settings set last_sync=now() where id > 0",
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
