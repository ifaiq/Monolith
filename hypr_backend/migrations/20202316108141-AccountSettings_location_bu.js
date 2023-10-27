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
    "business_unit_id",
    { type: "int" },
    function (err) {
      if (err) {
        console.log(err);
      } else {
        return db.addForeignKey(
          "account_settings",
          "business_units",
          "account_settings_business_unit_id_fk",
          {
            business_unit_id: "id",
          },
          { onDelete: "CASCADE", onUpdate: "RESTRICT" },
          (err) => {
            if (err)
              console.log(
                "ERROR AT CREATING BU FOREIGN KEY FOR ACCOUNT SETTINGS",
                err
              );
            else {
              return db.addColumn(
                "account_settings",
                "location_id",
                { type: "int" },
                function (err) {
                  if (err) {
                    console.log(err);
                  } else {
                    return db.addForeignKey(
                      "account_settings",
                      "locations",
                      "account_settings_location_id_fk",
                      {
                        location_id: "id",
                      },
                      { onDelete: "CASCADE", onUpdate: "RESTRICT" },
                      (err) => {
                        if (err)
                          console.log(
                            "ERROR AT CREATING LOCATION FOREIGN KEY FOR ACCOUNT SETTINGS",
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
