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
  return db.addColumn(
    "customer_retailer_shop_details",
    "shop_open_time",
    { type: "string", defaultValue: null },
    (err) => {
      if (err)
        console.log("ERROR AT ADDING shop_open_time COLUMN IN customer_retailer_shop_details");
      else {
        return db.addColumn(
          "customer_retailer_shop_details",
          "shop_close_time",
          { type: "string", defaultValue: null },
          (err) => {
            if (err)
              console.log("ERROR AT ADDING shop_close_time COLUMN IN customer_retailer_shop_details");
            else {
              return db.addColumn(
                "customer_retailer_shop_details",
                "shop_preferred_delivery_time",
                { type: "string", defaultValue: null },
                (err) => {
                  if (err)
                    console.log("ERROR AT ADDING shop_preferred_delivery_time COLUMN IN customer_retailer_shop_details");
                  else {
                    return db.addColumn(
                      "customer_retailer_shop_details",
                      "shop_closed_days",
                      { type: "string", defaultValue: null },
                      (err) => {
                        if (err)
                          console.log("ERROR AT ADDING shop_closed_days COLUMN IN customer_retailer_shop_details");
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

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
