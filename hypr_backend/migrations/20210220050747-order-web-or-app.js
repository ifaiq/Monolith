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
  return db.runSql(
    "ALTER TABLE `orders` ADD COLUMN `from_web` TINYINT(1) NULL DEFAULT '0'",
    [],
    function (err) {
      if (err) {
        console.log(err);
      } else {
        return db.runSql(
          "ALTER TABLE `orders` ADD COLUMN `call_centre_status` VARCHAR(255) NULL DEFAULT 'PENDING'",
          [],
          function (err) {
            if (err) {
              console.log(err);
            } else {
            }
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
