'use strict';

var dbm;
var type;
var seed;

const TABLE_NAME = 'generic_products';
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
      location_id:  {
        type: "int",
        foreignKey: {
          name: "generic_products_location_id_fk",
          table: "locations",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    function (err) {
      if (err) {
        console.log("ERROR AT CREATING GENERIC PRODUCTS TABLE");
      } else {
      }
    }
  );
};

exports.down =async function(db) {
  return await db.dropTable(TABLE_NAME);
};

exports._meta = {
  "version": 1
};
