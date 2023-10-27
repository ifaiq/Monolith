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
  return db.createTable(
    "customer_retailer_shop_details",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      shop_name: { type: "string", defaultValue: null },
      shop_location: { type: "string", defaultValue: null },
      shop_type_id: {
        type: "int",
        foreignKey: {
          name: "customer_shop_details_type_id_fk",
          table: "customer_retailer_shop_types",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      shop_picture: { type: "string", defaultValue: null },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    function (err) {
      if (err) {
        console.log("ERROR AT CREATING CUSTOMER RETAILER SHOP DETAILS TABLE");
      } else {
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
