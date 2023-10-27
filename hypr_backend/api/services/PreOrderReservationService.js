module.exports = {
  addOrUpdateRecord: function (orderId, data) {
    sails.log.debug(`OrderID: ${orderId} addOrUpdateRecord Data: ${JSON.stringify(data)}`);
    return new Promise((resolve, reject) => {
      if (data && data.length > 0) {
        PreOrderReserve.destroy({ order_id: orderId }).exec(function (
          err,
          deleted
        ) {
          if (err) {
            sails.log.warn(`OrderID: ${orderId} Error in deleting pre order reserve inventory: ${JSON.stringify(err)}`);
          } else {
            sails.log.info(`OrderID: ${orderId} Pre order reserve inventory deleted`);
          }
          PreOrderReserve.create(data[0]).exec(function (err, wasCreated) {
            if (err) {
              sails.log.warn(`OrderID: ${orderId} Error in saving pre order reserve inventory: ${JSON.stringify(err)}`);
            }
            if (wasCreated) {
              sails.log.debug(`OrderID: ${orderId} pre order reserve inventory created: ${JSON.stringify(wasCreated)}`);
            }
            resolve("ok");
          });
        });
      } else {
        sails.log.debug(`OrderID: ${orderId} addOrUpdateRecord no data`);
        resolve("ok");
      }
    });
  },
};
