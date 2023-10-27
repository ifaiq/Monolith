const {
  constants: {
    request: {
      VERSIONING: { v1 },
    },
  },
} = require("../../constants/http");

const { deliverySlotsService } = require("../../modules/v1/DeliverySlots");

const controllerLogIdentifier = `API version: ${v1}, Context: DeliverySlotsController`;

const getDeliverySlotsPortal = async (req, res) => {
  const {
    userId,
    user: { role },
    query: { locationId },
    headers: {
      clienttimeoffset: clientTimeOffset,
    },
  } = req;
  const logIdentifier = `${controllerLogIdentifier}.getDeliverySlotsPortal(), UserId: ${userId}, Role: ${role},`;
  try {
    const response = await deliverySlotsService.getDeliverySlotsPortal(locationId, clientTimeOffset);
    return res.ok(response);
  } catch (err) {
    sails.log.error(
      `${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`,
    );
    return res.error(err);
  }
};

const upsertDeliverySlotsForPortal = async (req, res) => {
  const {
    userId,
    user: { role },
    body: { deliverySlots, locationId },
  } = req;
  const logIdentifier = `${controllerLogIdentifier}.upsertDeliverySlotsForPortal(), UserId: ${userId}, Role: ${role},`;
  try {
    await deliverySlotsService.upsertDeliverySlots(deliverySlots, locationId, userId);
    return res.ok();
  } catch (err) {
    sails.log.error(
      `${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`,
    );
    return res.error(err);
  }
};

const getDeliverySlots = async (req, res) => {
  const {
    userId,
    user: { role },
    query: { locationId },
    headers: {
      clienttimeoffset: clientTimeOffset,
    },
  } = req;
  const logIdentifier = `${controllerLogIdentifier}.getDeliverySlots(), UserId: ${userId}, Role: ${role},`;
  try {
    const response = await deliverySlotsService.getDeliverySlots(locationId, clientTimeOffset, userId);
    return res.ok(response);
  } catch (err) {
    sails.log.error(
      `${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`,
    );
    return res.error(err);
  }
};

module.exports = {
  getDeliverySlotsPortal,
  upsertDeliverySlotsForPortal,
  getDeliverySlots,
};
