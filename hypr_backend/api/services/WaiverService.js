
const { lock } = require("./RedisService");

module.exports = {
  createWaiver: async (meta, orderId, waiverAmount, waiverReasonId, userId) => {
    return new Promise(async (resolve, reject) => {
      const unlock = await lock(`${sails.config.globalConf.redisEnv}:createWaiver-${orderId}`);
      try {
        const duplicateWaiver = await OrderAmountAdjustment.findOne({
          order_id: orderId,
          context_name: 'WAIVER',
          deleted_at: null
        })

        if (duplicateWaiver) {
          reject("Waiver Already Exists");
          return;
        }

        let amountExceeded = await WaiverService.checkWaiverAmount(meta, orderId, waiverAmount);

        if (amountExceeded) {
          if (typeof(amountExceeded) !== 'string') {
            amountExceeded = JSON.stringify(amountExceeded);
          }
          reject(amountExceeded);
          return;
        }

        const waiver = await Waiver.create({
          amount: parseFloat(waiverAmount).toFixed(2),
          reason_id: waiverReasonId,
          user_id: userId,
        })

        await OrderAmountAdjustment.create({
          order_id: orderId,
          context_id: waiver.id,
          context_name: 'WAIVER',
        });

        resolve();
      } catch (err) {
        reject(err);
      } finally {
        unlock();
      }
    });
  },

  updateWaiver: async (meta, orderId, waiverAmount, waiverReasonId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let order = await Order.findOne({
          id: orderId
        })

        if (order.status_id != 5) {
          reject("Order Status is not In-Transit");
          return;
        }

        let amountExceeded = await WaiverService.checkWaiverAmount(meta, orderId, waiverAmount);

        if (amountExceeded) {
          if (typeof(amountExceeded) != 'string') {
            amountExceeded = JSON.stringify(amountExceeded);
          }
          reject(amountExceeded);
          return;
        }

        const waiver = await OrderAmountAdjustment.findOne({
          order_id: orderId,
          context_name: 'WAIVER',
          deleted_at: null
        });
        await Waiver.updateOne({
          id: waiver.id,
        }).set({
          amount: parseFloat(waiverAmount).toFixed(2),
          reason_id: waiverReasonId
        });

        resolve();
      }
      catch (err) {
        reject(err);
      }
    });
  },

  removeWaiver: async (meta, orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let order = await Order.findOne({
          id: orderId
        })

        if (order.status_id != 5) {
          reject("Order Status is not In-Transit");
          return;
        }

        await OrderAmountAdjustment.updateOne({
          order_id: orderId,
          context_name: 'WAIVER',
          deleted_at: null
        }).set({
          deleted_at: new Date(),
        });

        resolve();
      }
      catch (err) {
        reject(err);
      }
    });
  },

  checkWaiverAmount: async (meta, orderId, waiverAmount) => {
    try {
      const order = await Order.findOne({
        where: { id: orderId },
        select: 'total_price'
      });

      if (_.isEmpty(order)) {
        throw "Order not found!";
      }

      const orderAmount = order.total_price;
      if (orderAmount >= waiverAmount ) {
        return;
      }
      throw "Waiver Amount Exceeds Order Total";
    }
    catch (err) {
      return (err);
    }
  },

  /**
   * Function fetches waiver
   *
   */
  findWaiver: async (orderId) => {
    const orderWaiver = await OrderAmountAdjustment.findOne({
      order_id: orderId,
      context_name: "WAIVER",
      deleted_at: null,
    });
    if (orderWaiver) {
      const waiver = await Waiver.findOne({
        id: orderWaiver.context_id,
      });
      return waiver ? waiver.amount : 0;
    }
    return 0; // if no waiver is found return
  },
}
