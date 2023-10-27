"use strict";


var fs = require('fs');
var path = require('path');
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
    "liked_products_customer_junction",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      product_id: {
        type: "int",
        foreignKey: {
          name: "lpc_junction_product_id_fk",
          table: "products",
          rules: {
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          },
          mapping: "id",
        },
      },
      customer_id: {
        type: "int",
        foreignKey: {
          name: "lpc_junction_customer_id_fk",
          table: "customers",
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
        console.log("ERROR AT CREATING LIKED PRODUCTS MODES TABLE");
      } else {
      }
    }
  );
};

exports.down = function (db) {
  var filePath = path.join(__dirname, 'sqls', '20211109071701-like-products-down.sql');
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
      if (err) return reject(err);
      console.log('received data: ' + data);

      resolve(data);
    });
  })
    .then(function (data) {
      return db.runSql(data);
    });
};


exports._meta = {
  version: 1,
};
