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
    "ALTER TABLE `city_areas` ADD COLUMN `company_id` INT(11) NULL DEFAULT NULL AFTER `disabled`",
    [],
    function (err) {
      if (err) {
        console.log(err);
      } else {
        return db.runSql(
          "ALTER TABLE `city_areas` ADD COLUMN `business_unit_id` INT(11) NULL DEFAULT NULL AFTER `company_id`",
          [],
          function (err) {
            if (err) {
              console.log(err);
            } else {
              return db.runSql(
                "ALTER TABLE `city_areas` ADD COLUMN `location_id` INT(11) NULL DEFAULT NULL AFTER `business_unit_id`",
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
