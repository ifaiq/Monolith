'use strict';
var fs = require('fs');
var path = require('path');

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
  var filePath = path.join(__dirname, 'sqls', '20220606183833-constraints-migration-up.sql');
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
      if (err) return reject(err);
      resolve(data);
    });
  })
    .then(async function (data) {
      db.runSql(data);
    });
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
