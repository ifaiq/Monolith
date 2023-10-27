var cron = require("node-cron");

setTimeout(function () {
  if (process.env.NODE_ENV == "production") {
    cron.schedule("59 6 */1 * *", function () {
      let companies = ["MONT", "MARK", "CHASE", "RET"];
      for (let i = 0; i < companies.length; i++) {
        // OrderService.sendOrderUpdateEmail(companies[i]);
      }
    });
  }
}, 10000);
