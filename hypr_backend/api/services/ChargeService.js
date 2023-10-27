module.exports = {
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  iterateAccountCharges: async function (location_id) {
    return new Promise(async (resolve, reject) => {
      if (location_id) {
        try {
          let location = await Location.findOne({ id: location_id })
            .populate("business_unit_id")
            .populate("company_id");
          if (location) {
            if (
              !GeneralHelper.emptyOrAllParam(location.service_charge_type) &&
              !GeneralHelper.emptyOrAllParam(location.delivery_charge_type)
            ) {
              resolve({
                service_charge_type: location.service_charge_type,
                service_charge_value: location.service_charge_value
                  ? location.service_charge_value
                  : 0,
                delivery_charge_type: location.delivery_charge_type,
                delivery_charge_value: location.delivery_charge_value
                  ? location.delivery_charge_value
                  : 0,
              });
            } else if (
              !GeneralHelper.emptyOrAllParam(
                location.business_unit_id.service_charge_type
              ) &&
              !GeneralHelper.emptyOrAllParam(
                location.business_unit_id.delivery_charge_type
              )
            ) {
              resolve({
                service_charge_type:
                  location.business_unit_id.service_charge_type,
                service_charge_value: location.business_unit_id
                  .service_charge_value
                  ? location.business_unit_id.service_charge_value
                  : 0,
                delivery_charge_type:
                  location.business_unit_id.delivery_charge_type,
                delivery_charge_value: location.business_unit_id
                  .delivery_charge_value
                  ? location.business_unit_id.delivery_charge_value
                  : 0,
              });
            } else if (
              !GeneralHelper.emptyOrAllParam(
                location.company_id.service_charge_type
              ) &&
              !GeneralHelper.emptyOrAllParam(
                location.company_id.delivery_charge_type
              )
            ) {
              resolve({
                service_charge_type: location.company_id.service_charge_type,
                service_charge_value: location.company_id.service_charge_value
                  ? location.company_id.service_charge_value
                  : 0,
                delivery_charge_type: location.company_id.delivery_charge_type,
                delivery_charge_value: location.company_id.delivery_charge_value
                  ? location.company_id.delivery_charge_value
                  : 0,
              });
            } else {
              reject("INVALID RESULT");
            }
          } else {
            reject("Location Not Found");
          }
        } catch (err) {
          reject(err);
        }
      } else {
        reject("MISSING REQUIRED PARAM");
      }
    });
  },
  getAccountCharges(location_id, order_total) {
    return new Promise(async (resolve, reject) => {
      let service_value = 0,
        delivery_value = 0;
      if (
        GeneralHelper.emptyOrAllParam(order_total) ||
        GeneralHelper.emptyOrAllParam(location_id)
      ) {
        reject("MISSING REQUIRED PARAM");
      } else {
        try {
          let charges = await ChargeService.iterateAccountCharges(location_id);
          service_value =
            charges.service_charge_type == "FLAT"
              ? charges.service_charge_value
              : (charges.service_charge_value / 100) * order_total;
          delivery_value =
            charges.delivery_charge_type == "FLAT"
              ? charges.delivery_charge_value
              : (charges.delivery_charge_value / 100) * order_total;
          resolve({
            success: true,
            service_charge: parseFloat(service_value).toFixed(2),
            delivery_charge: parseFloat(delivery_value).toFixed(2),
          });
        } catch (err) {
          reject(err);
        }
      }
    });
  },
};
