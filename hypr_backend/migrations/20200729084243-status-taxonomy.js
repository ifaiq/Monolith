'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.createTable(
    "status_taxonomy",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      order_id: {
        type: "int",
        foreignKey: {
          name: "order_taxonomy_fk",
          table: "orders",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      status_name: { type: "string", defaultValue: null },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    function (err) {
      if (err) {
        console.log("ERROR AT CREATING STATUS TAXONOMY TABLE");
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
