module.exports = {
  createWaiver: async function (req, res) {
    const logIdentifier = `WaiverController.createWaiver(), ReqID: ${
      req.allParams().id
    }, UserID: ${res.locals.userData.id}, context: ${req.url}`;
    
    try {
      const params = req.allParams();
      const meta = {
        reqId: params.id,
        userData: res.locals.userData || "N/A",
        caller: "WaiverController.createWaiver()",
        clientTimeOffset: params.clientTimeOffset,
      };

      sails.log(`${logIdentifier} called with params -> ${JSON.stringify(params)}`);

      const createdWaiver = await WaiverService.createWaiver(meta, params.orderId, params.waiverAmount, params.waiverReasonId, res.locals.userData.id);
      sails.log(`${logIdentifier} Waiver created -> ${JSON.stringify(createdWaiver)}`);
      res.ok();
    }
    catch (err) {
      sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
      res.serverError(err);
    }
  },

  updateWaiver: async function (req, res) {
    const logIdentifier = `WaiverController.updateWaiver(), ReqID: ${
      req.allParams().id
    }, UserID: ${res.locals.userData.id}, context: ${req.url}`;
    
    try {
      const params = req.allParams();
      const meta = {
        reqId: params.id,
        userData: res.locals.userData || 'N/A',
        caller: "WaiverController.updateWaiver()",
        clientTimeOffset: params.clientTimeOffset
      };
      
      sails.log(`${logIdentifier} called with params -> ${JSON.stringify(params)}`);

      const updatedWaiver = await WaiverService.updateWaiver(meta, params.orderId, params.waiverAmount, params.waiverReasonId);
      sails.log(`${logIdentifier} Waiver updated -> ${JSON.stringify(updatedWaiver)}`);
      res.ok();
    }
    catch (err) {
      sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
      res.serverError(err);
    }
  },

  removeWaiver: async function (req, res) {
    const logIdentifier = `WaiverController.removeWaiver(), ReqID: ${
      req.allParams().id
    }, UserID: ${res.locals.userData.id}, context: ${req.url}`;
    
    try {
      const params = req.allParams();
      const meta = {
        reqId: params.id,
        userData: res.locals.userData || 'N/A',
        caller: "WaiverController.removeWaiver()",
        clientTimeOffset: params.clientTimeOffset
      };

      sails.log(`${logIdentifier} called with params -> ${JSON.stringify(params)}`);

      await WaiverService.removeWaiver(meta, params.orderId);
      sails.log(`${logIdentifier} Waiver removed for orderId -> ${JSON.stringify(params.orderId)}`);
      res.ok();
    }
    catch (err) {
      sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
      res.serverError(err);
    }
  },
}