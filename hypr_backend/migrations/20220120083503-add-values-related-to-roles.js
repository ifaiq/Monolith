let dbm;
let type;
const fs = require("fs");
const path = require("path");

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options) {
  dbm = options.dbmigrate;
  type = dbm.datatype;
};

exports.up = function (db, callback) {
  const filePath = path.join(__dirname + "/sqls/20220120082911-add-values-related-to-roles-up.sql");
  fs.readFile(filePath, {encoding: "utf-8"}, (err, data) =>  {
    if (err) return console.log(err);
    db.runSql(data, err => {
      if (err) return console.log(err);
      callback();
    });
  });
};

exports.down = function (db, callback) {
  return null;
};
