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
    "products",
    "catalogue_product_id",
    { type: "int" },
    (err) => {
      if (err) {
        console.log("ERROR AT ADDING CATALOGUE PRODUCTS ID COLUMN IN PRODUCTS");
        console.log(err);
      } else {
        return db.addForeignKey(
          "products",
          "catalogue_products",
          "product_catalogue_id_for_products_fk",
          {
            catalogue_product_id: "id",
          },
          { onDelete: "CASCADE", onUpdate: "RESTRICT" },
          (err) => {
            if (err)
              console.log(
                "ERROR AT CREATING CATALOGUE PRODUCTS ID FOREIGN KEY FOR PRODUCTS",
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
