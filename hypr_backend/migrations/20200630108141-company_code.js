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
    "code",
    { type: "string", unique: true },
    (err) => {
      if (err) {
        console.log("ERROR AT ADDING CODE COLUMN IN COMPANIES");
        console.log(err);
      } else {
        return db.runSql(
          "UPDATE companies SET code='MONT' WHERE id > 0 && name = 'Montreal'",
          [],
          function (err) {
            if (err) {
              console.log("ERROR AT ADDING CODE FOR MONTREAL");
              console.log(err);
            } else {
              return db.runSql(
                "UPDATE companies SET code='MARK' WHERE id > 0 && name = 'Marksman'",
                [],
                function (err) {
                  if (err) {
                    console.log("ERROR AT ADDING CODE FOR MARK");
                    console.log(err);
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
