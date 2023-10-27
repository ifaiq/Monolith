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
  return db.runSql(
    "INSERT INTO customer_retailer_order_modes (id, name) SELECT 1, 'Retailo App' WHERE not exists(SELECT * FROM customer_retailer_order_modes WHERE id=1)",
    [],
    function (err) {
      if (err) console.log(err);
      else {
        return db.runSql(
          "INSERT INTO customer_retailer_order_modes (id, name) SELECT 2, 'Inbound Call' WHERE not exists(SELECT * FROM customer_retailer_order_modes WHERE id=2)",
          [],
          function (err) {
            if (err) console.log(err);
            else {
              return db.runSql(
                "INSERT INTO customer_retailer_order_modes (id, name) SELECT 3, 'Whatsapp Voice' WHERE not exists(SELECT * FROM customer_retailer_order_modes WHERE id=3)",
                [],
                function (err) {
                  if (err) console.log(err);
                  else {
                    return db.runSql(
                      "INSERT INTO customer_retailer_order_modes (id, name) SELECT 4, 'Whatsapp Chat' WHERE not exists(SELECT * FROM customer_retailer_order_modes WHERE id=4)",
                      [],
                      function (err) {
                        if (err) console.log(err);
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

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
