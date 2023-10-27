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
    "customers",
    "DOB",
    { type: "datetime", defaultValue: null },
    (err) => {
      if (err) console.log("ERROR AT ADDING DOB COLUMN IN CUSTOMERS");
      else {
        return db.addColumn(
          "customers",
          "customer_stripe_id",
          { type: "string", defaultValue: null },
          (err) => {
            if (err) console.log("ERROR AT ADDING STRIPE ID COLUMN IN CUSTOMERS");
            else {
              return db.addColumn(
                "customers",
                "supervisor_id",
                { type: "int", defaultValue: null },
                (err) => {
                  if (err) console.log("ERROR AT ADDING SUPERVISOR ID COLUMN IN CUSTOMERS");
                  else {
                    return db.addForeignKey(
                      "customers",
                      "users",
                      "supervisor_user_id_fk",
                      {
                        supervisor_id: "id",
                      },
                      { onDelete: "CASCADE", onUpdate: "RESTRICT" },
                      (err) => {
                        if (err)
                          console.log(
                            "ERROR AT CREATING SUPERVISOR FOREIGN KEY FOR CUSTOMER",
                            err
                          );
                        else {
                        }
                      }
                    );
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
