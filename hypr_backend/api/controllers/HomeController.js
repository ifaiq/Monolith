/**
 * HomeController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const RedisService = require("../services/RedisService");

module.exports = {
  index: async (req, res) => {
    try {
      res.reply({
        message: "Hypr commerce engine is running.",
      });
    } catch (err) {
      res.error(err);
    }
  },
  clearRedis: async (req, res) => {
    await RedisService.flushKeys("*", true);
    res.ok();
  },
  healthCheck: async (req, res) => {
    try {
      res.reply({
        message: "Hypr commerce engine is running.",
      });
    } catch (err) {
      res.error(err);
    }
  }
};
