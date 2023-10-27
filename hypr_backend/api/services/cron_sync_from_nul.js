// var cron = require("node-cron");
// setTimeout(function () {
//   if (process.env.NODE_ENV == "production") {
//     cron.schedule("59 00 * * *", async function () {
//       try {
//         let query = "update account_settings set last_sync = null";
//         await sails.sendNativeQuery(query);
//         SyncService.saveLastSync();
//       } catch (err) {
//         sails.log.error(`error while setting last sync ${JSON.stringify(err)}`);
//       }
//     });
//   }
// }, 10000);
