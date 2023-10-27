'use strict';

var dbm;
var type;
var seed;
const fs = require("fs");
const path = require("path");

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
  const filePath = path.join(__dirname, "sqls", "20220608143309-add-back-order-status-reason-up.sql");
  return new Promise( ( resolve, reject ) => {
    fs.readFile(filePath, {encoding: "utf-8"}, (err, data) =>  {
      if (err) return reject(err);
      console.log("received data: " + data);

      resolve(data);
    });
  })
    .then(data => db.runSql(data));
};

exports.down = function(db) {
  const filePath = path.join(__dirname, "sqls", "20220608143309-add-back-order-status-reason-down.sql");
  return new Promise( ( resolve, reject ) => {
    fs.readFile(filePath, {encoding: "utf-8"}, (err, data) =>  {
      if (err) return reject(err);
      console.log("received data: " + data);

      resolve(data);
    });
  })
    .then(data => db.runSql(data));
};
