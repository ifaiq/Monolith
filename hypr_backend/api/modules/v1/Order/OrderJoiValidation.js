const { Joi } = require("../../../../utils/services");
const { validateOrderStatusId,
  //  getCurrentDateWithCustomHours
} = require("./Utils");
// const {validateOrderStatusReason} = require("./Utils");
const {
  messages: {
    INVALID_STATUS_ID,
    // INVALID_STATUS_REASON,
    // INVALID_DELIVERY_TIME,
  },
} = require("./Messages");

// POST /api/v1/order
const postOrderValidation = Joi.object().keys({
  body: Joi.object({
    locationId: Joi.number().integer().positive().strict().required(),
    products: Joi.array()
      .min(1)
      .items(
        Joi.object({
          id: Joi.number().integer().positive().strict().required(),
          quantity: Joi.number().integer().positive().strict().required(),
          deliveryTime: Joi.date().timestamp("unix").options({ convert: true }).optional(),
        }).unknown(true),
      )
      .strict()
      .required(),
    deliveryAddressId: Joi.number().integer().positive().strict(),
    deliveryTime: Joi.date()
      .timestamp()
      // .custom(deliveryTime => {
      //   if (getCurrentDateWithCustomHours() >= deliveryTime.getTime()) {
      //     throw new Error(INVALID_DELIVERY_TIME());
      //   }
      // })
      .optional(),
    paymentType: Joi.string().strict().required(),
    coupon: Joi.object({
      id: Joi.number().integer().positive().strict(),
      name: Joi.string().strict(),
    }),
    zones: Joi.string().optional().allow(""),
    shopTypeId: Joi.number().integer().positive().optional().allow("").allow(null),
  }).unknown(true),
  query: Joi.object({
    validateDeliveryTime: Joi.boolean().default(false),
  }).unknown(true),
});

// PUT /api/v1/setOrderStatusLogistics and /api/v1/setOrderStatusPortal
const putOrderStatusValidation = Joi.object()
  .keys({
    body: Joi.object({
      orderId: Joi.number().integer().positive().strict().required(),
      statusId: Joi.number().integer().positive().custom(statusId => {
        const isValidValue = validateOrderStatusId(statusId);
        if (!isValidValue) {
          throw new Error(INVALID_STATUS_ID());
        }
        return statusId;
      }).strict().required(),
      statusReasonId: Joi.number().integer().positive().strict(),
      // TODO We will update the validtion after updating the data
      // statusReasonId: Joi.number().integer().positive().strict().custom((statusReason) => {
      //     const isValidValue = validateOrderStatusReason(statusReason);
      //     if (!isValidValue) {
      //         throw new Error(INVALID_STATUS_REASON());
      //     }
      //     return statusReason;
      // }),
      orderItems: Joi.array().items(
        Joi.object({
          id: Joi.number().integer().positive().strict().required(),
          quantity: Joi.number().integer().min(0).strict().required(),
          removed: Joi.boolean().strict().required(),
          productId: Joi.number().integer().strict(),
        }).unknown(true),
      ),
      waiver: Joi.number().positive().strict(),
      cashReceived: Joi.number().min(0).strict(),
    }).unknown(true),
  });

// GET /api/v1/order/statuses
const putOrderStatusesValidation = Joi.object()
  .keys({
    query: Joi.object({
      id: Joi.string().pattern(/^[0-9]/),
      customerId: Joi.string().pattern(/^[0-9]/),
    }).unknown(true),
  });

// GET /api/v1/order/
const putOrderValidation = Joi.object()
  .keys({
    params: Joi.object({
      id: Joi.string().pattern(/^[0-9]/).required(),
    }).unknown(true),
  });

const putOrderPaymentTypeValidation = Joi.object()
  .keys({
    body: Joi.object({
      orderId: Joi.number().integer().positive().strict().required(),
      orderAmount: Joi.number().strict().required(),
      paymentType: Joi.string().strict(),
    }).unknown(true),
  });

const getOrderPaymentType = Joi.object()
  .keys({
    query: Joi.object({
      id: Joi.number().integer().min(1).required(),
    }).unknown(true),
  });

const getLatestOrderByCustomerId = Joi.object()
  .keys({
    query: Joi.object({
      id: Joi.number().integer().min(1).required(),
    }).unknown(true),
  });

const getGrowthOrderMetrics = Joi.object()
  .keys({
    query: Joi.object({
      customerId: Joi.string().pattern(new RegExp(/([0-9]+,)*[0-9]/)).min(1).required().default("1,2,3"),
      startTime: Joi.date().timestamp("unix").options({ convert: true }).required()
        .default(Date.parse(new Date((new Date()).setMonth((new Date()).getMonth() - 1)).toUTCString())),
      endTime: Joi.date().timestamp("unix").options({ convert: true })
        .default(Date.parse(new Date().toUTCString())),
      select: Joi.string().pattern(new RegExp(/([a-zA-Z]+,)*[a-zA-Z]/)).min(3)
        .default("gmv,dgmv,ogmv,odgmv,totalCount,totalOrganicOrders,spo,spr"),
      deliveryBatches: Joi.string(),
    }).unknown(true),
  });

const getCategoriesDgmvByCustomerId = Joi.object()
  .keys({
    query: Joi.object({
      customerIds: Joi.string().pattern(new RegExp(/([0-9]+,)*[0-9]/)).min(1).required(),
      categoryIds: Joi.string().pattern(new RegExp(/([0-9]+,)*[0-9]/)).min(1).required().default("1,2,3"),
      startTime: Joi.date().timestamp("unix").options({ convert: true }).required()
        .default(Date.parse(new Date((new Date()).setMonth((new Date()).getMonth() - 1)).toUTCString())),
      endTime: Joi.date().timestamp("unix").options({ convert: true }).required()
        .default(Date.parse(new Date().toUTCString())),
    }).unknown(true),
  });

// POST /api/v1/order/spot-order
const spotOrderValidation = Joi.object().keys({
  body: Joi.object({
    locationId: Joi.number().integer().positive().strict().required(),
    customerId: Joi.number().integer().positive().strict().required(),
    batchId: Joi.number().integer().positive().strict().required(),
    products: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().integer().positive().strict().required(),
          quantity: Joi.number().integer().positive().strict().required(),
          price: Joi.number().positive().strict().required(),
        }).unknown(true),
      )
      .strict()
      .required(),
    paymentType: Joi.string().valid("COD").required(),
  }).unknown(true),
});

// GET /api/v1/order/:orderId/items
const fetchOrderItemsValidation = Joi.object().keys({
  params: {
    id: Joi.string().pattern(/^[0-9]/).required(),
  },
});

module.exports = {
  postOrderValidation,
  putOrderStatusValidation,
  putOrderStatusesValidation,
  putOrderPaymentTypeValidation,
  putOrderValidation,
  getOrderPaymentType,
  getLatestOrderByCustomerId,
  getGrowthOrderMetrics,
  getCategoriesDgmvByCustomerId,
  spotOrderValidation,
  fetchOrderItemsValidation,
};
