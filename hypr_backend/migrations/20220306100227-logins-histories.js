'use strict';

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

exports.up = (db) => {
  return db.createTable(
    "login_history",
    {
      id: { type: "int", primaryKey: true, autoIncrement: true },
      customer_id: { type: "int", defaultValue: null },
      user_id: { type: "int", defaultValue: null },
      app_type: { type: "int", defaultValue: null },
      last_login: { type: "datetime", defaultValue: null },
      created_at: { type: "datetime", defaultValue: null },
      updated_at: { type: "datetime", defaultValue: null },
      deleted_at: { type: "datetime", defaultValue: null },
    },
    function (err) {
      if (err) {
        console.log("ERROR AT CREATING LOGIN HISTORY TABLE");
      } else {
      }
    }
  );
};

exports.down = async (db) => await db.runSql(`DROP TABLE login_history;`, []);

exports._meta = {
  "version": 1
};
