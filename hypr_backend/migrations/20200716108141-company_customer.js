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
  return db.addColumn("customers", "company_id", { type: "int" }, function (
    err
  ) {
    if (err) {
      console.log(err);
    } else {
      return db.addForeignKey(
        "customers",
        "companies",
        "customer_company_id_fk",
        {
          company_id: "id",
        },
        { onDelete: "CASCADE", onUpdate: "RESTRICT" },
        (err) => {
          if (err)
            console.log(
              "ERROR AT CREATING COMPANY FOREIGN KEY FOR CUSTOMERS",
              err
            );
          else {
          }
        }
      );
    }
  });
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
