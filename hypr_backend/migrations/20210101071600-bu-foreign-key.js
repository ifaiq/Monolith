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
    "ALTER TABLE customers MODIFY business_unit_id INTEGER;",
    [],
    function (err) {
      if (err) console.log(err);
      else {
        return db.addForeignKey(
          "customers",
          "business_units",
          "customers_bu_id_fk",
          {
            business_unit_id: "id",
          },
          { onDelete: "CASCADE", onUpdate: "RESTRICT" },
          (err) => {
            if (err)
              console.log(
                "ERROR AT CREATING CATEGORIES FOREIGN KEY FOR CATEGORIES (SELF RELATION)",
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

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
