'use strict';

var dbm;
var type;
var seed;

const TABLE_NAME = 'recommended_products_sql';
/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = async (db) => {
  return db.createTable(
    TABLE_NAME,
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      product_ids: {
        type: "string",
        columnType: "varchar(max)"
      },
      customer_id: {
        type: "int",
      },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    function (err) {
      if (err) {
        console.log("ERROR AT CREATING LIKED PRODUCTS MODES TABLE");
      } else {
      }
    }
  );
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
