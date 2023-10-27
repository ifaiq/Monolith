const AWS = require("aws-sdk");
const csv = require("fast-csv");
const s3 = new AWS.S3();
const OdooService = require("../services/OdooService");
const OrderDao = require("../modules/v1/Order/OrderDao");
const { getPagination } = require("../../utils/services/index");
const { productService: { updateBulkProductStock, findProductById, findProducts } } = require('../modules/v1/Product');
const { updateBatchPaymentsCashAmounts, getOrdersBreakdown } = require("../modules/v1/Payments");
const userExtractionService = require('../user_service_extraction/userService');
const customerRetailerShopExtractionService = require('../user_service_extraction/customerRetailerShopDetailService');
const customerExtractionService = require('../user_service_extraction/customerService');
const customerAddressExtractionService = require('../user_service_extraction/customerAddressService');
const locationExtractionService = require('../config_service_extraction/locationsExtraction');
const businessUnitExtractionService = require('../config_service_extraction/businessUnitExtraction');
const CouponDao = require("../modules/v1/Coupon/CouponDao");
const camelcaseKeys = require("camelcase-keys");
const { getBusinessUnitById } = require("../modules/v1/BusinessUnit/BusinessUnitService");
const { findLocation } = require("../modules/v1/Location/LocationService");
const {
	redisService: {
		locking,
		unLocking,
	},
} = require("../modules/v1/Redis");
const { ORDER_TYPES: { SPOT_ORDER }, PAYMENT_TYPES: { COD_WALLET, COD, SADAD, SADAD_WALLET }} = require("../modules/v1/Order/Constants");
const { createBatchHistory } = require("../modules/v1/Batch/BatchService");
const { BATCH_HISTORY_TYPES } = require("../modules/v1/Batch/Constants");
const snakecaseKeys = require("snakecase-keys");
const { getConsumerPriceForProduct } = require("../modules/v1/Arithmos/Arithmos");
const { validateAvsStock, fetchAvsStock } = require('../modules/v1/Wms');
const { DeliveryBatchStates: { PENDING, ACCEPTED, COMPLETED } } = require("./Constants");
const { delete:deletebatch, patch: updateJob } = require("../clients/AxiosClient");
const { createServiceToken } = require("@development-team20/auth-library/dist");
const { URLS:{ GROWTH_SERVICE_BASE_URL, DELETE_BATCH, UPDATE_JOB }, RTG_STATES: { DONE, LOCKED, IN_PROGRESS } } = require("../modules/v1/Batch/Constants");
const { findOrder, findOrders } = require("../modules/v1/Order/OrderService");

const createBatch = async (meta, orderIds, products, agentId, locationId) => {
	return new Promise(async (resolve, reject) => {
		try {
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
			meta.caller = 'BatchService.createBatch()';
			sails.log.info(`${logIdentifier} In BatchService.create()`);
			sails.log(`${logIdentifier} called with params -> orderIds: ${orderIds}, agentId: ${agentId}, locationId: ${locationId}`);

			await checkConflictingOrdersInBatches(meta, orderIds);	// check if the order is already in another active batch

			let assembledBatch = await assembleNewBatch(meta, orderIds, products, agentId, locationId);

			let createdBatch = await createBatchInDB(assembledBatch);

      if(orderIds.length > 0) {
        await updateOrdersAgentAndStatus(meta, orderIds, agentId, Constants.HyprOrderStates.IN_TRANSIT, createdBatch.id);
        await createBatchOrders(createdBatch.id, orderIds);
      }

			resolve(createdBatch);
		}
		catch (err) {
			sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.create() -> ${JSON.stringify(err.stack || err)}`);
			if (!err.mailMessage) {
				err.mailMessage = 'Something went wrong in batch creation on the server, Please try again later';
			}
			reject(err);
		}
	});
};

const createBatchInDB = async (batch) => {
	return new Promise(async (resolve, reject) => {
		try {
			let createdBatch = await DeliveryBatch.create(batch);
			resolve(createdBatch);
		}
		catch (err) {
			reject(err);
		}
	});
};

const assembleNewBatch = async (meta, orderIds, products, agentId, locationId) => {
	return new Promise(async (resolve, reject) => {
		try {
			let newBatch = createNewBatchEntity(locationId, agentId);
			let orderItems = await OrderService.getOrderItems({
				where: { order_id: orderIds },
				select: ['product_id', 'quantity', 'price', 'tax']
			});
			newBatch.products = await assembleBatchProducts(meta, orderItems);
      if (products && products.length) {
        for (let spotProduct of products) {
          const index = newBatch.products.findIndex(orderedProduct => orderedProduct.id === spotProduct.id);
          if (index >= 0) {
            newBatch.products[index].onboarded_quantity += spotProduct.quantity;
            newBatch.products[index].current_quantity += spotProduct.quantity;
            newBatch.products[index].spot_current_quantity = spotProduct.quantity;
            newBatch.products[index].spot_assigned_quantity = spotProduct.quantity;
          } else {
            const spotProductData = await findProductById(spotProduct.id);
            const { consumerPrice } = getConsumerPriceForProduct(spotProductData);
            newBatch.products.push({
              id: spotProduct.id,
              name: spotProductData.name,
              onboarded_quantity: spotProduct.quantity,
              current_quantity: spotProduct.quantity,
              spot_current_quantity: spotProduct.quantity,
              spot_assigned_quantity: spotProduct.quantity,
              price: consumerPrice,
              imageUrl: spotProductData.imageUrl,
            });
          }
        }
      }
      newBatch.products = JSON.stringify(newBatch.products);
			resolve(newBatch);
		}
		catch (err) {
			reject(err);
		}
	});
};

const createNewBatchEntity = (locationId, agentId) => {
	let newBatch = {
		"status_id": PENDING,
		"location_id": locationId,
		"assigned_to": agentId,
	};
	return newBatch;
};

const updateOrdersAgentAndStatus = async (meta, orderIds, agentId, updateStatus, batchId = null) => {
	return new Promise(async (resolve, reject) => {
		try {
			for (let orderId of orderIds) {
				await Order.updateAndCreateHistory(
					{ id: orderId },
					{
						status_id: updateStatus,
						delivery_boy_id: agentId,
					},
					meta?.userData?.id,
					Constants.HyprRoles.getKeyFromValue(meta.userData.role.id),
					batchId
				)
				sails.log(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Order ID: ${orderId} status got changed to 'In-transit'`);
			}
			resolve();
		}
		catch (err) {
			err.mailMessage = 'Something went wrong while updating orders, Please try again later';
			reject(err);
		}
	});
};

const mapUniqueFieldsToArray = (arrayToMap, fieldToMap) => {
	try {
		let toReturn = arrayToMap.map(x => x[fieldToMap]);
		toReturn = _.uniq(toReturn);
		return toReturn;
	}
	catch (err) {
		throw err;
	}
};

const checkConflictingOrdersInBatches = async (meta, orderIds) => {
	return new Promise(async (resolve, reject) => {
		try {
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
			meta.caller = 'BatchService.checkConflictingOrdersInBatches()';
			sails.log.info(`${logIdentifier} In checkConflictingOrdersInBatches()`);

			let orderBatches = await getBatchOrdersFromDB({
				where: { order_id: orderIds },
				select: 'batch_id'
			});

			if (orderBatches.length != 0) {
				let batches = mapUniqueFieldsToArray(orderBatches, "batch_id");

				let activeBatches = await getBatchesFromDB({
					// Changed to '<' to accomodate closed batches
					where: { id: batches, status_id: { "<": 6 } },
					select: 'id'
				});
				if (activeBatches.length == 0) {
					resolve();
				}
				else {
					reject({
						mailMessage: `One of the orders ${orderIds} already exists in active batch/es ${JSON.stringify(activeBatches)}`
					});
				}
			}
			else {
				resolve();
			}
		}
		catch (err) {
			sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.checkConflictingOrdersInBatches() -> ${JSON.stringify(err.stack || err)}`);
			err.mailMessage = 'Something went wrong while checking for order conflicts, Please try again later';
			reject(err)
		}
	});
};

const createBatchOrders = async (createdBatchId, orderIds) => {
	return new Promise(async (resolve, reject) => {
		try {
			let batchOrdersArray = assembleCreateBatchOrdersArray(createdBatchId, orderIds)
			let createdBatchOrders = await createBatchOrdersInDB(batchOrdersArray);
			resolve(createdBatchOrders);
		}
		catch (err) {
			reject(err);
		}
	});
};

const createBatchOrdersInDB = async (batchOrdersArray) => {
	return new Promise(async (resolve, reject) => {
		try {
			let createdBatchOrders = await DeliveryBatchOrder.createEach(batchOrdersArray);
			resolve(createdBatchOrders);
		}
		catch (err) {
			reject(err);
		}
	});
};

const assembleCreateBatchOrdersArray = (createdBatchId, orderIds) => {
	try {
		let batchOrders = [];
		let deliveryPriority = 1;
		for (let orderId of orderIds) {
			batchOrders.push({
				"order_id": orderId,
				"batch_id": createdBatchId,
				"delivery_priority": deliveryPriority
			});
			deliveryPriority++;
		}
		return batchOrders;
	}
	catch (err) {
		throw err;
	}
};

const getBatchOrdersFromDB = async (criteria) => {
	return new Promise(async (resolve, reject) => {
		try {
			if (!_.isEmpty(criteria)) {
				// adding filter to omit deleted batches
				// not using 'in' or has own property operator as direct key addressing is more faster
				if (Number.isInteger(criteria.where)) {
					let batchOrderId = criteria.where;
					criteria.where = {
						id: batchOrderId,
						deleted_at: null
					};
				}
				else if (criteria.where !== undefined) {
					criteria.where.deleted_at = null;
				}
				else {
					criteria.deleted_at = null;
				}
				let batchOrders = await DeliveryBatchOrder.find(criteria);
				resolve(batchOrders);
			}
			else {
				sails.log.error(`could not get batchOrders, supplied criteria was empty -> ${JSON.stringify(criteria)}`);
				reject(`could not get batcheOrders, supplied criteria was empty -> ${JSON.stringify(criteria)}`);
			}
		}
		catch (err) {
			reject(err);
		}
	});
};

const getBatchesFromDB = async (criteria) => {
	return new Promise(async (resolve, reject) => {
		try {
			if (!_.isEmpty(criteria)) {
				// adding filter to omit deleted batches
				if (Number.isInteger(criteria.where)) {
					let batchId = criteria.where;
					criteria.where = {
						id: batchId,
						deleted_at: null
					};
				}
				else if (Array.isArray(criteria.where)) {
					let batchIds = criteria.where;
					criteria.where = {
						id: batchIds,
						deleted_at: null
					};
				}
				else if (criteria.where !== undefined) {
					criteria.where.deleted_at = null;
				}
				else {
					criteria.deleted_at = null;
				}
				let batches = await DeliveryBatch.find(criteria);
				resolve(batches);
			}
			else {
				sails.log.error(`could not get batches, supplied criteria was empty -> ${JSON.stringify(criteria)}`);
				reject(`could not get batches, supplied criteria was empty -> ${JSON.stringify(criteria)}`);
			}
		}
		catch (err) {
			reject(err);
		}
	});
};

const getBatchByIdFromDB = async (criteria) => {
	return new Promise(async (resolve, reject) => {
		try {
			if (!_.isEmpty(criteria)) {
				// adding filter to omit deleted batches
				if (Number.isInteger(criteria.where)) {
					let batchId = criteria.where;
					criteria.where = {
						id: batchId,
						deleted_at: null
					};
				}
				else if (criteria.where !== undefined) {
					criteria.where.deleted_at = null;
				}
				else {
					criteria.deleted_at = null;
				}
				let batches = await DeliveryBatch.findOne(criteria);
				resolve(batches);
			}
			else {
				sails.log.error(`could not get the batch, supplied criteria was empty -> ${JSON.stringify(criteria)}`);
				reject(`could not get the batch, supplied criteria was empty -> ${JSON.stringify(criteria)}`);
			}
		}
		catch (err) {
			reject(err);
		}
	});
};

const getBatchesWithStatusFromDB = async (criteria) => {
	return new Promise(async (resolve, reject) => {
		try {
			if (!_.isEmpty(criteria)) {
				// need to take copy of criteria as it changes after passing through a query block
				const originalCriteria = { ...criteria };

				// adding filter to omit deleted batches
				if (Number.isInteger(criteria.where) || Array.isArray(criteria.where)) {
					let batchId = criteria.where;
					criteria.where = {
						id: batchId,
						deleted_at: null
					};
				}
				else if (criteria.where !== undefined) {
					criteria.where['deleted_at'] = null;
				}
				else {
					criteria.deleted_at = null;
				}
				let batches = await DeliveryBatch.find(criteria)
					.populate("status_id");

				// handle the pagination case
				if (!criteria.limit) {
					resolve(batches);
				}
				else {
					const total_count = await DeliveryBatch.count(originalCriteria.where);
					resolve([batches, total_count]);
				}

			}
			else {
				sails.log.error(`could not get batches, supplied criteria was empty -> ${JSON.stringify(criteria)}`);
				reject(`could not get batches, supplied criteria was empty -> ${JSON.stringify(criteria)}`);
			}
		}
		catch (err) {
			reject(err);
		}
	});
};

const assembleBatchProducts = async (meta, orderItems) => {
	return new Promise(async (resolve, reject) => {
		try {
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
			meta.caller = 'BatchService.addProductsToBatch()'
			sails.log.info(`${logIdentifier} In addProductsToBatch()`);

			let productNames = await getProductNamesFromOrderItems(orderItems);
			let productNamesObj = arrayOfObjectsToKeyValuePairs(productNames);
			let products = accumulateProductsForBatch(orderItems, productNamesObj);
			let sortedProducts = sortArrayByProductNames(products);

			resolve(sortedProducts);
		}
		catch (err) {
			sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in addProductsToBatch() -> ${JSON.stringify(err.stack)}`);
			reject(err);
		}
	});
};

const accumulateProductsForBatch = (orderItems, productNamesObj) => {
	try {
		let accumulatedProducts = [];
		for (let item of orderItems) {
			let productIndex = accumulatedProducts.findIndex(x => x.id === item.product_id);
			if (productIndex < 0) {
				accumulatedProducts.push({
					id: item.product_id,
					name: productNamesObj[item.product_id].name,
					onboarded_quantity: item.quantity,
					current_quantity: item.quantity,
					price: item.price,
					imageUrl: productNamesObj[item.product_id].image_url
				});
			}
			else {
				accumulatedProducts[productIndex].onboarded_quantity += item.quantity;
				accumulatedProducts[productIndex].current_quantity += item.quantity;
			}
		}
		return accumulatedProducts;
	}
	catch (err) {
		throw err;
	}
};

const sortArrayByProductNames = (unsortedArray) => {
	let sortedArray = unsortedArray.sort((a, b) => a.name.localeCompare(b.name));
	return sortedArray;
};

const getProductNamesFromOrderItems = async (orderItems) => {
	return new Promise(async (resolve, reject) => {
		try {
			let productIds = mapUniqueFieldsToArray(orderItems, "product_id");
			let productWithNames = await Product.find({
				where: { id: productIds },
				select: ['name', 'image_url']
			});
			resolve(productWithNames);
		}
		catch (err) {
			reject(err);
		}
	});
};

const arrayOfObjectsToKeyValuePairs = (arrayOfObjects) => {
	try {
		let arrayOfPairs = arrayOfObjects.map(x => [x.id, x.name, x.image_url]);
		let toReturnObj = {};
		for (let x of arrayOfPairs) {
			toReturnObj[x[0]] = {name: x[1], image_url: x[2]};
		}
		return toReturnObj;
	}
	catch (err) {
		throw err;
	}
};

const bulkCreateBatches = async (meta, streamDataArray, locationId) => {
	return new Promise(async (resolve, reject) => {
		try {
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
			meta.caller = 'BatchService.bulkCreateBatches()';
			sails.log.info(`${logIdentifier} In BatchService.bulkCreateBatches()`);
			sails.log(`${logIdentifier} called with params -> streamDataArray: ${streamDataArray}, locationId: ${locationId}`);

			let batchCreationData = await buildDataForBatchCreation(meta, streamDataArray);

			for (let batch of batchCreationData) {
				const orders = await OrderService.getOrders({ id: batch.orders });
        const productIds = batch.products.map(product => product.id);
				const products = await findProducts({ id: productIds });
				await checkBatchOrdersStatusAndLocation(meta, batch.orders, orders, locationId);
				await checkBatchSpotProducts(meta, batch.products, products, locationId);
				await updateBulkProductStock(batch.products);
				await createBatch(meta, batch.orders, batch.products, batch.agentId, locationId);

				await sendCustomerNotification(meta, orders);
				sendBatchMail(meta, "");
			}

			resolve();
		}
		catch (err) {
			sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.bulkCreateBatches() -> ${JSON.stringify(err.stack || err)}`);
			err.sendMail = true;
			reject(err);
		}
	});
};

const getBatchesForAdmin = async (meta, params) => {
	return new Promise(async (resolve, reject) => {
		try {
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
			meta.caller = 'BatchService.getBatchesForAdmin()';
			sails.log.info(`${logIdentifier} In getBatchesForAdmin()`);

			let filterCriteria = constructFilterCriteriaWithPagination(meta, params);

			let [deliveryBatches, total_count] = await getBatchesWithStatusFromDB(filterCriteria);

			let batches = await attachInfoToBatchesAdmin(meta, deliveryBatches);

			resolve({ batches, total_count });
		}
		catch (err) {
			sails.log.error(`Error in BatchService.getBatchesForAdmin() -> ${JSON.stringify(err.stack)}`);
			reject(err);
		}
	});
};

const constructFilterCriteriaWithPagination = (meta, params) => {
	try {
		let filterCriteria = {
			where: {}
		};
		if (params.startDate && params.endDate) {
			filterCriteria.where.created_at = {
				'>=': GeneralHelper.dateObjectToMySqlDateConversion(new Date(params.startDate)),
				'<=': GeneralHelper.dateObjectToMySqlDateConversion(new Date(params.endDate))
			};
		}
		else if (params.startDate) {
			filterCriteria.where.created_at = {
				'>=': GeneralHelper.dateObjectToMySqlDateConversion(new Date(params.startDate))
			};
		}
		else if (params.endDate) {
			filterCriteria.where.created_at = {
				'<=': GeneralHelper.dateObjectToMySqlDateConversion(new Date(params.endDate))
			};
		}
		if (params.locationId) filterCriteria.where.location_id = parseInt(params.locationId);
		if (params.locationIds) {
			filterCriteria.where.location_id = { in: params.locationIds }
		};
		if (params.assignedTo) filterCriteria.where.assigned_to = parseInt(params.assignedTo);
		if (params.statusId) filterCriteria.where.status_id = parseInt(params.statusId);
		if (params.cardStatus) filterCriteria.where.is_red = parseInt(params.cardStatus);
		if (params.rtgStatusId) filterCriteria.where.rtg_status_id = parseInt(params.rtgStatusId);
		if (params.search && Number.isInteger(+params.search)) filterCriteria.where.id = parseInt(params.search) // search from batch id only for now
		if (params.page && params.per_page) {
			Object.assign(filterCriteria, getPagination(params.page, params.per_page));
		}
		filterCriteria.sort = "created_at DESC";

		return filterCriteria;
	}
	catch (err) {
		sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.getBatchesForAdmin() -> ${JSON.stringify(err.stack)}`);
		throw err;
	}
};
// TODO: this function needs a revamp
const attachInfoToBatchesAdmin = async (meta, deliveryBatches) => {
	return new Promise(async (resolve, reject) => {
		try {
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
			meta.caller = 'BatchService.attachInfoToBatchesAdmin()';
			sails.log.info(`${logIdentifier} In attachInfoToBatchesAdmin()`);

			const allBatchIds = deliveryBatches.map((batch) => batch.id);
			const allBatchLocationIds = _.uniq(deliveryBatches.map((batch) => batch.location_id));

			const locationWithBuisnessUnits = camelcaseKeys(await locationExtractionService.find({
				id: allBatchLocationIds,
				relations: ["businessUnit"],
			  }), { deep: true });

			const allOrdersInBatches = await allBatchOrderIds(allBatchIds);
			const allOrdersIds = allOrdersInBatches.batchOrders.map(batchOrder => batchOrder.order_id);
			const ordersCriteria = {
				where: { id: { in: allOrdersIds } },
				select: [
					"id", "customer_id", "total_price", "coupon_discount", "payment_type", "volume_based_discount", "location_id"
				],
			};
			const getAllOrdersData = await OrderDao.findAll(ordersCriteria);
			const allCustomerIds = _.uniq(getAllOrdersData.map(item => item.customerId));
			
			const allCustomers = allCustomerIds.length ? await customerExtractionService.findAll({
				relations: "shopDetails",
				allData: true
			}, { id: allCustomerIds.join(',') }) : [];
			const getFormattedData = await getFormattedDataForOrders(getAllOrdersData, locationWithBuisnessUnits);
			const getAllOrderBreakdown = await getOrdersBreakdown(getFormattedData);

			const batches = [];
			for (const batch of deliveryBatches) {
				const orderDetailsRes = await getOrderDetailsForAdmin(batch.assigned_to, batch.location_id, batch.id);
				const orders = {};
				
				const allOrdersIds = orderDetailsRes.batchOrders.map(batchOrder => batchOrder.order_id);
				const allOrdersInDeliveryBatch = await Order.find({
					where: { id: { in: allOrdersIds } },
					select: [
						"customer_id", "total_price", "placed_at", "status_id", "cash_received", "coupon_id", "coupon_discount", "payment_type", "location_id", "volume_based_discount"
					],
				});

				let couponIds = allOrdersInDeliveryBatch.map(order => order.coupon_id).filter(coupon_id => coupon_id);
				couponIds = [] // interim code, to be removed
				const allCoupons = couponIds.length ? await CouponDao.find({ id: couponIds }) : [];
				for (const batchOrder of orderDetailsRes.batchOrders) {
					const orderDetails = allOrdersInDeliveryBatch.find(order => order.id === batchOrder.order_id);
					if (!orderDetails) {
						sails.log(`bad order id exist in the batch: order id - ${batchOrder.order_id}`);
						continue;
					}

					if (orderDetails.coupon_id) {
						orderDetails.coupon_id = allCoupons.find(coupon => coupon.id === orderDetails.coupon_id) || null;
					}

					// Populating the customer_id key
					orderDetails.customer_id = allCustomers.find(customer => customer.id === orderDetails.customer_id);
					let waiverAmount = null;
					if (orderDetails.status_id === Constants.HyprOrderStates.IN_TRANSIT ||
						orderDetails.status_id === Constants.HyprOrderStates.DELIVERED ||
						orderDetails.status_id === Constants.HyprOrderStates.PARTIAL_DELIVERED) {
						const orderWaiver = await OrderAmountAdjustment.findOne({
							order_id: batchOrder.order_id,
							context_name: 'WAIVER',
							deleted_at: null
						});
						if (orderWaiver) {
							const waiver = await Waiver.findOne({
								id: orderWaiver.context_id
							});
							waiverAmount = parseFloat(waiver.amount.toFixed(2));
							orderDetails.total_price = parseFloat((orderDetails.total_price - waiverAmount).toFixed(2));
						}
					}
					const orderStatus = Constants.HyprOrderStates.getOrderStatusFromId(orderDetails.status_id);
					orders[orderDetails.id] = {
						"id": orderDetails.id,
						"customer_name": orderDetails.customer_id ? orderDetails.customer_id.name: '',
						"shop_name": orderDetails.customer_id && orderDetails.customer_id.shop_details.length ? orderDetails.customer_id.shop_details[0].shop_name: '',
						"location_id": orderDetails.location_id,
						"payment_type": orderDetails.payment_type,
						"customer_address": orderDetails.customer_id ? orderDetails.customer_id.address: '',
						"total_amount": orderDetails.coupon_discount ? parseFloat((orderDetails.total_price - orderDetails.coupon_discount).toFixed(2)) : orderDetails.total_price,
						"coupon_discount_amount": orderDetails.coupon_discount,
						"coupon_discount_type": orderDetails.coupon_id ? Constants.CouponDiscountTypes.getCouponTypeFromId(orderDetails.coupon_id.discount_type) : null,
						"waiver_amount": waiverAmount,
						"order_status_id": orderDetails.status_id,
						"order_date": orderDetails.placed_at,
						"order_status": orderStatus,
						"cash_received": orderDetails.cash_received,
						"sadadAmount": 0,
						"walletAmount": 0,
						"amountPayable": parseFloat((
							orderDetails.total_price - ((orderDetails.coupon_discount || 0) + (orderDetails.volume_based_discount || 0))
							).toFixed(2)
						)
					}
				}

				const calculatedOrders = {};
				const orderDetailsObject = Object.values(orders);
				if (orderDetailsObject.length >= 1) {
					for (const singleBatchOrder of orderDetailsObject) {
						const isZero = singleBatchOrder.order_status_id === Constants.HyprOrderStates.CANCELLED || 
							singleBatchOrder.order_status_id === Constants.HyprOrderStates.ON_HOLD;
						if (singleBatchOrder.payment_type === COD && isZero) {
							calculatedOrders[singleBatchOrder.id] = {
								...singleBatchOrder,
								walletAmount: 0,
								amountPayable: 0
							}
						} else if (singleBatchOrder.payment_type === COD_WALLET) {
							calculatedOrders[singleBatchOrder.id] = {
								...singleBatchOrder,
								walletAmount: isZero ? 0 : getAllOrderBreakdown[`${singleBatchOrder.id}`]?.walletAmount,
								amountPayable: isZero ? 0 : getAllOrderBreakdown[`${singleBatchOrder.id}`]?.amountPayable,
							}
						} else if (singleBatchOrder.payment_type === SADAD || singleBatchOrder.payment_type === SADAD_WALLET) {
							calculatedOrders[singleBatchOrder.id] = {
								...singleBatchOrder,
								walletAmount: isZero ? 0 : getAllOrderBreakdown[`${singleBatchOrder.id}`]?.walletAmount,
								sadadAmount: isZero ? 0 : getAllOrderBreakdown[`${singleBatchOrder.id}`]?.sadadAmount,
								cashAmount: isZero ? 0 : getAllOrderBreakdown[`${singleBatchOrder.id}`]?.amountPayable,
							}
						} else {
							calculatedOrders[singleBatchOrder.id] = {
								...singleBatchOrder
							}
						}
					}
				}
				batches.push({
					id: batch.id,
					status_name: batch.status_id.name,
					status_id: batch.status_id.id,
					agent_id: orderDetailsRes.user ? orderDetailsRes.user.id : 'N/A',
					agent_name: orderDetailsRes.user ? orderDetailsRes.user.name : 'N/A',
					store_id: orderDetailsRes.location ? orderDetailsRes.location.id : 'N/A',
					store_name: orderDetailsRes.location ? orderDetailsRes.location.name : 'N/A',
					created_at: batch.created_at,
					orders: calculatedOrders,
					products: JSON.parse(batch.products),
					cash_collected: batch.cash_collected,
					non_cash_collected: batch.non_cash_collected,
					non_cash_type: batch.non_cash_type,
					difference_reason: batch.difference_reason,
					cash_receivable: batch.cash_receivable,
					inventory_shortage_amount: batch.inventory_shortage_amount,
          rtg_agent_id: batch?.rtg_agent_id,
          rtg_status_id: batch?.rtg_status_id,
          card_status: batch?.is_red,
				});
			}
			resolve(batches);
		}
		catch (err) {
			sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.attachInfoToBatchesAdmin() -> ${JSON.stringify(err.stack)}`);
			reject(err);
		}
	});
};

const getFormattedDataForOrders = async (orders, locationWithBuisnessUnits) => {
	return orders.map((order) => {
		const { businessUnit } = locationWithBuisnessUnits.find((location) => location.id === order.locationId);
		return {
			...order,
			currency: businessUnit?.currency,
			sadadAmount: 0,
			amountPayable: parseFloat((
				order.totalPrice - ((order.couponDiscount || 0) + (order.volumeBasedDiscount || 0))
				).toFixed(2)
			)
		}
	})
}

const allBatchOrderIds = async (batchIds) => {
	const batchOrderIds = await DeliveryBatchOrder.find({
		where: { batch_id: { in: batchIds }, deleted_at: null },
		select: ["order_id"]
	});
	return {
		batchOrders: batchOrderIds
	};
};

const getOrderDetailsForAdmin = async (assignedTo, locationId, batchId) => {
	return new Promise(async (resolve, reject) => {
		try {
			let orderDetailsResponse = await Promise.all([
				userExtractionService.getOne({ id: assignedTo, select: ["name"] }),
				locationExtractionService.findOne({ id: locationId, select: ["name", "id"] }),
				DeliveryBatchOrder.find({
					where: {
						batch_id: batchId,
						deleted_at: null
					},
					select: ["order_id"]
				})
			]);
			let orderDetails = {
				user: orderDetailsResponse[0],
				location: orderDetailsResponse[1],
				batchOrders: orderDetailsResponse[2]
			}
			resolve(orderDetails);
		}
		catch (err) {
			reject(err);
		}
	});
};

const getBatchesForAgent = async (meta, agentId, batchId, acceptBatch) => {
	try {
		let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
		meta.caller = 'BatchService.getBatchesForAgent()'
		sails.log.info(`${logIdentifier} In getBatchesForAgent()`);

		return new Promise(async (resolve, reject) => {
			try {
				if (!agentId) {
					return reject('Agent ID is required!!');
				}
				let date = new Date();
				let timezoneOffset = date.getTimezoneOffset() * 60000;
				let fromDate = date.getTime() + timezoneOffset - 259200000;  // 72 hours ago
				fromDate = GeneralHelper.dateObjectToMySqlDateConversion(new Date(fromDate));
				let filterCriteria = {
					"assigned_to": agentId,
					"deleted_at": null,
				};
				if (batchId) {
					filterCriteria.id = batchId;
				} else {
					filterCriteria.or = [
						{ "status_id": { "<": 5 } },
						{ "completed_at": { ">": fromDate } }
					];
				}

				if (acceptBatch) {
					const batchInProgress = await DeliveryBatch.find({
						assigned_to: agentId,
						deleted_at: null,
						status_id: { ">": 1, "<": 6 }
					});
					if (batchInProgress?.length) {
						sails.log.warn(`${logIdentifier} batch ${batchInProgress[0].id} assigned to ${agentId} is already in progress`);
						return reject('A batch assigned to you is already in progress');
					}
				}

				let agentBatches = await DeliveryBatch.find({
					where: filterCriteria,
					sort: "created_at DESC"
				});


				let batches = await attachInfoToBatchesForAgent(meta, agentBatches);
				if (process.env.ALLOW_FETCH_AVS == "true"){
					if (batchId) {
						const fetchAvsProducts = await fetchAvsStock(batches.agentBatches[0]);
						const fetchAvsProductsObject = {};
						fetchAvsProducts.forEach((product) => {
							fetchAvsProductsObject[product.productId] = product;
						});
						batches.agentBatches[0].products = batches.agentBatches[0].products.map((product) => {
							return {
								...product,
								availableForSaleQuantity: process.env.ALLOW_AVS_DATA == "true" 
									? product.onboarded_quantity 
									: fetchAvsProductsObject[product.id] 
										? fetchAvsProductsObject[product.id].availableForSaleQuantity 
										: 0,
							}
						});
					}
				}
				if (batches.activeBatch) {
					sails.log(`${logIdentifier} Active batch is true, fetching orders of active batch for this agent`);
					let activeBatchOrders = await getOrdersByBatch(meta, batches.activeBatch);
					resolve({ batches: batches.agentBatches, orders: activeBatchOrders.orders });
				}
				else {
					resolve({ batches: batches.agentBatches });
				}
			}
			catch (err) {
				sails.log.error(`${logIdentifier} Error in BatchService.getBatchesForAgent() -> ${JSON.stringify(err.stack)}`);
				reject(err);
			}
		});
	}
	catch (err) {
		sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.getBatchesForAgent() -> ${JSON.stringify(err.stack)}`);
		throw err;
	}
};

const attachInfoToBatchesForAgent = async (meta, agentBatches) => {
	return new Promise(async (resolve, reject) => {
		try {
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
			meta.caller = 'BatchService.attachInfoToBatchesForAgent()';
			sails.log.info(`${logIdentifier} In attachInfoToBatchesForAgent()`);
			let activeBatch = 0;
			for (let batch of agentBatches) {
				// NOTE: we have updated batch.status_id < 5 to < 6,
				// because we required orders in logistics app in case of batch completed too.
				if (batch.status_id > 1 && batch.status_id < 6) {
					activeBatch = batch.id;
				}
				let batchOrders = await DeliveryBatchOrder.find({
					where: {
						batch_id: batch.id,
						deleted_at: null
					},
					select: ["order_id"]
				});
				let cashCollected = 0;

				for (let batchOrder of batchOrders) {
					let orderCash = await Order.findOne({
						where: { id: batchOrder.order_id },
						select: ["cash_received"]
					});
					cashCollected += orderCash ? orderCash.cash_received : 0;
				}
				sails.log(`${logIdentifier} Total cash received -> ${cashCollected}`);
				batch.cash_collected = Math.round(cashCollected * 100) / 100;
				batch.products = JSON.parse(batch.products);
				for (const index in batch.products) {
					if (batch.products[index].current_quantity != batch.products[index].onboarded_quantity) {
						const product = batch.products.splice(index, 1);
						batch.products.unshift(product[0])
					}
				}
			}
			resolve({ agentBatches, activeBatch });
		}
		catch (err) {
			sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.attachInfoToBatchesAgent() -> ${JSON.stringify(err.stack)}`);
			reject(err);
		}
	});
};

const updateAndAccept = async (meta, batch) => {
	try {
		let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
		meta.caller = 'BatchService.updateAndAccept()';
		sails.log.info(`${logIdentifier} In BatchService.updateAndAccept()`);

		return new Promise(async (resolve, reject) => {
			let lock;
			const productInventory = [];
			try {
				if (batch && typeof batch == 'object' && Array.isArray(batch.products)) {
					const ttl = 30000;
					sails.log.info(`BatchService.updateAndAccept(): Locking Batch : ${batch.id}`);
					const resource = `locks:batch:${batch.id}`;
					lock = await locking(resource, ttl);
					let batchInProgress = await DeliveryBatch.find({
						assigned_to: batch.assigned_to,
						deleted_at: null,
						status_id: { ">": 1, "<": 6 }
					});
					if (batchInProgress.length == 0) {
						let currentBatch = await DeliveryBatch.findOne({
							id: batch.id
						});
					if (process.env.IS_VALIDATE_AVS_STOCK_ENABLED == "true"){
						try {
							const unAvailableProducts = await validateAvsStock({...batch, warehouseId: currentBatch.location_id});
							if (unAvailableProducts.length > 0) {
								return reject({
								showDialog: true,
								message: 'Error, please check with your lead',
								products: unAvailableProducts
								});
							}
						} catch (err) {
							sails.log.info(`Error occured while validating AVS stock - ${JSON.stringify(err)}`);
						}
					}
						const currentBatchProducts = JSON.parse(currentBatch.products);
						for (let index in batch.products) {
							const currentIndex = currentBatchProducts.findIndex(currentBatchProduct => currentBatchProduct.id === batch.products[index].id);
							if (batch.products[index].onboarded_quantity != currentBatchProducts[currentIndex].onboarded_quantity) {
								/**
								 * Change Request v1: 02-Aug-21
								 * Change Log: commenting out pick short adding back to inventory
								 * adding pick short to batch product json to add it back later
								 */
								// updateProductInventory(currentBatchProducts[index].id, currentBatchProducts[index].onboarded_quantity - batch.products[index].onboarded_quantity, true)
								const pickShort = currentBatchProducts[currentIndex].onboarded_quantity - batch.products[index].onboarded_quantity;
								if (pickShort >= 0) {
									batch.products[index].pick_short = pickShort;
									if (batch.products[index].spot_current_quantity){
										if (batch.products[index].pick_short <= batch.products[index].spot_current_quantity) {
											batch.products[index].spot_current_quantity -= batch.products[index].pick_short;
										} else {
											batch.products[index].ordered_quantity_difference = batch.products[index].pick_short - batch.products[index].spot_current_quantity;
											batch.products[index].spot_current_quantity = 0;
										}
									}
								} else {
									sails.log.info(`${logIdentifier} in updateAndAccept(). Pick short amount is in negative batch id: ${batch.id}, product: ${batch.products[index]}, current product: ${currentBatchProducts[index]}`);
								}
							}
						}
						const activeBatchOrders = await getOrdersByBatch(meta, batch.id);	
						let updatedBatch;
						if (process.env.ALLOW_INVENTORY_UPDATE_WMS === "true") 
						{
							let batchData;
							updatedBatch = await sails.getDatastore().transaction(async db => {
								const updates = []
								for (const product of batch.products) {
									const query = `UPDATE products SET physical_stock = physical_stock - $1 WHERE id = ${product.id};`;
									updates.push(sails.sendNativeQuery(query, [product.onboarded_quantity]).usingConnection(db))
								}
								await Promise.all(updates);

                sails.log.info(`Bacth is updating in updateAndAccept(). Batch Id: ${batch.id}, New status id: 2, Batch data: ${JSON.stringify(batch)}`);

								batchData = await DeliveryBatch.updateOne({
									id: batch.id,
									assigned_to: batch.assigned_to
								}).set({
									products: JSON.stringify(batch.products),
									status_id: activeBatchOrders.orders.length ? ACCEPTED : COMPLETED
								}).usingConnection(db);

                sails.log.info(`Bacth updates in updateAndAccept(). Batch Id: ${batch.id}, Updated batch data: ${JSON.stringify(batchData)}`);

								return batchData;
							});
							for (const product of batch.products) {
								productInventory.push({
									id: product.id,
									quantity: product.onboarded_quantity
								});
								const result = ProductService.updateProductInEs(product.id);
								result.then(response => {
									response.success
										? sails.log.info("SUCCESSFULLY UPDATED PRODUCT IN ES")
										: sails.log.info(result.trace);
								}).catch(e => {
									sails.log(`Exception: `, e);
								});
							}
						}
						else {
              sails.log.info(`Bacth is updating in updateAndAccept(). Batch Id: ${batch.id}, New status id: 2, Batch data: ${JSON.stringify(batch)}`);

							updatedBatch = await DeliveryBatch.updateOne({
								id: batch.id,
								assigned_to: batch.assigned_to
							}).set({
									products: JSON.stringify(batch.products),
									status_id: activeBatchOrders.orders.length ? ACCEPTED : COMPLETED
								});

              sails.log.info(`Bacth updates in updateAndAccept(). Batch Id: ${batch.id}, Updated batch data: ${JSON.stringify(updatedBatch)}`);
						}
						sails.log.info(`BatchService.updateAndAccept(): Creating History for Batch`);
						createBatchHistory({
							batchId: batch.id,
							type: BATCH_HISTORY_TYPES.ACCEPTED,
							oldJSON: currentBatch,
							newJSON: updatedBatch
						})
						sails.log.info(`BatchService.updateAndAccept(): Updated Status and history created for batch: ${batch.id} - batchData: ${JSON.stringify(updatedBatch)}`);
						try {
							sails.log.info(`products - ${JSON.stringify(updatedBatch.products)} type of json - ${typeof updatedBatch.products}`)
							updatedBatch.products = JSON.parse(updatedBatch.products);
						} catch (err) {
							sails.log.info(`error occured while stringifying - ${JSON.stringify(err)}`)
						}
						OdooService.syncBatchData(updatedBatch);

						resolve({ ...updatedBatch, orders: activeBatchOrders.orders });
					} else {
						sails.log.warn(`${logIdentifier} batch ${batchInProgress[0].id} assigned to ${batch.assigned_to} is already in progress`);
						reject('A batch assigned to you is already in progress');
					}
				} else {
					let userMessage = "batch was not supplied in the desired format";

					// todo: needs to be removed in future
					if (batch && typeof batch == 'object' && !Array.isArray(batch.products)) {
						userMessage += ", Please update your app !!";
					}

					sails.log.warn(`${logIdentifier} ${userMessage}`);
					reject(userMessage);
				}
				if (process.env.ALLOW_INVENTORY_UPDATE_WMS_SQS === 'true') {
					WMSService.syncProductInventoryOnStockflo({
						type: Constants.INVENTORY_SYNC_TYPES.BATCH_ACCEPT,
						batchId: batch.id,
						products: productInventory,
					});
				}
			} catch (err) {
				sails.log.error(`${logIdentifier} Error in BatchService.updateAndAccept() -> ${JSON.stringify(err.stack)}`);
				reject(err);
			} finally {
				sails.log.info(`updateAndAccept: Unlocking Batch : ${batch.id}`);
				unLocking(lock);
			}
		});
	}
	catch (err) {
		sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.updateAndAccept() -> ${JSON.stringify(err.stack)}`);
		throw err;
	}
};

const getOrdersByBatch = async (meta, batchId) => {
	try {
		let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
		meta.caller = 'BatchService.getOrdersByBatch()';
		sails.log.info(`${logIdentifier} In BatchService.getOrdersByBatch()`);
		sails.log(`${logIdentifier} called with batchId -> ${batchId}`);

		return new Promise(async (resolve, reject) => {
			try {
				if (!batchId || parseInt(batchId) == NaN) {
					sails.log.warn(`${logIdentifier} no batchId was supplied in the request`);
					return resolve();
				}
				let batchOrders = await DeliveryBatchOrder.find({
					select: ["order_id", "batch_id", "delivery_priority"],
					where: {
						"batch_id": parseInt(batchId),
						"deleted_at": null
					}
				});
        let orders = [];
        if (batchOrders.length > 0) {
          orders = await attachOrderDetails(meta, batchOrders);
          const location = camelcaseKeys(await locationExtractionService.findOne({
            id: orders[0]?.store_id,
            relations: ["businessUnit"],
            }), { deep: true });
          const currency = location.businessUnit.currency;
          orders = await updateBatchPaymentsCashAmounts(orders, currency);
        }
				resolve({ orders });
			}
			catch (err) {
				sails.log.error(`${logIdentifier} Error in BatchService.getOrdersByBatch() -> ${JSON.stringify(err.stack)}`);
				reject(err);
			}
		});
	}
	catch (err) {
		sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.getOrdersByBatch() -> ${JSON.stringify(err.stack)}`);
		throw err;
	}
};

const attachOrderDetails = async (meta, batchOrders) => {
	return new Promise(async (resolve, reject) => {
		try {
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
			meta.caller = 'BatchService.attachOrderDetails()';
			sails.log.info(`${logIdentifier} In BatchService.attachOrderDetails()`);
			let orders = [];
			for (let batchOrder of batchOrders) {
				let firstResults = await Promise.all([
					Order.findOne({
						where: { id: batchOrder.order_id },
						select: [
							"id",
							"total_price",
							"placed_at",
							"cash_received",
							"tax",
							"service_charge_type",
							"service_charge_value",
							"delivery_charge_type",
							"delivery_charge_value",
							"coupon_discount",
							"volume_based_discount",
							"delivery_priority",
							"customer_address_id",
							"location_id",
							"customer_id",
							"status_id",
							"coupon_id",
							"payment_type",
							"credit_buy_fee",
						]
					})
						// .populate("customer_id")
						.populate("status_id"),
						// .populate("customer_address_id")
						// .populate("location_id"),

					OrderItems.find({
						select: ["quantity", "product_id", "removed", "price", "tax"],
						where: { order_id: batchOrder.order_id }
					})
						.populate("product_id")
				]);

				let orderDetails = firstResults[0];
				let orderItems = firstResults[1];
				if (orderDetails.coupon_id) {
					// orderDetails.coupon_id = await CouponDao.findById(orderDetails.coupon_id);
				}
				// Populating the customer_id key
				orderDetails.customer_id = await customerExtractionService.findOne({ id: orderDetails.customer_id });
				orderDetails.customer_address_id = await customerAddressExtractionService.findOne({ id: orderDetails.customer_address_id });
				// adding tax for logistics app, getBatches call
				// order item returned price should have tax included
				orderDetails.location_id = await locationExtractionService.findOne({ id: orderDetails.location_id });

				orderItems = orderItems.map((item) => {
					item.price = parseFloat(item.price) + parseFloat(item.tax);
					return item;
				});

				if (orderDetails.status_id.id === Constants.HyprOrderStates.IN_TRANSIT ||
					orderDetails.status_id.id === Constants.HyprOrderStates.DELIVERED ||
					orderDetails.status_id.id === Constants.HyprOrderStates.PARTIAL_DELIVERED) {
					const orderWaiver = await OrderAmountAdjustment.findOne({
						order_id: orderDetails.id,
						context_name: 'WAIVER',
						deleted_at: null
					});
					if (orderWaiver) {
						const waiver = await Waiver.findOne({
							id: orderWaiver.context_id
						});
						orderDetails.waiver = {
							amount: parseFloat(waiver.amount.toFixed(2)),
							reasonId: waiver.reason_id,
							reason: Constants.WAIVER_REASONS.getWaiverReasonFromId(waiver.reason_id),
						}
					}
				}
				let secondResults = await Promise.all([
					customerRetailerShopExtractionService.findOne({
						select: ["shopName", "shopPicture"],
						customer_id: orderDetails.customer_id.id
					}),
					businessUnitExtractionService.findOne({ id: orderDetails.location_id.business_unit_id }),
				]);

				let shopDetails = secondResults[0];
				let countryCode = secondResults[1].country_code;

				let orderObj = await parseBatchOrders(meta, orderItems, orderDetails, batchOrder, shopDetails, countryCode);

				orders.push(orderObj);
			}
			resolve(orders);
		}
		catch (err) {
			sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.attachOrderDetails() -> ${JSON.stringify(err.stack)}`);
			reject(err);
		}
	})
};

const parseBatchOrders = async (meta, orderItems, orderDetails, batchOrder, shopDetails, countryCode) => {
	return new Promise((resolve, reject) => {
    let orderObj;
		try {
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
			meta.caller = 'BatchService.parseBatchOrders()';
			sails.log.info(`${logIdentifier} In BatchService.parseAgentOrders()`);
			let items = [];
			for (let orderItem of orderItems) {
				items.push({
					"id": orderItem.product_id.id,
					"item_id": orderItem.id,
					"image_url": orderItem.product_id.image_url,
					"quantity": orderItem.quantity,
					"name": orderItem.product_id.name,
					"stock_quantity": orderItem.product_id.stock_quantity,
					"price": orderItem.price,
					"size": orderItem.product_id.size,
					"brand": orderItem.product_id.brand,
					"removed": orderItem.removed,
					"tax_percent": orderItem.product_id.tax_percent
				});
			}

			let subTotal = parseFloat(orderDetails.total_price).toFixed(2);
			let serviceCharge = GeneralHelper.getFlatOrPercent(
				orderDetails.service_charge_type,
				orderDetails.service_charge_value,
				subTotal
			);
			let deliveryCharge = GeneralHelper.getFlatOrPercent(
				orderDetails.delivery_charge_type,
				orderDetails.delivery_charge_value,
				subTotal
			);
			let grandTotal = (
				parseFloat(orderDetails.total_price) -
				(parseFloat(orderDetails.volume_based_discount || 0.0) +
				parseFloat(orderDetails.coupon_discount || 0.0)) +
				parseFloat(orderDetails.credit_buy_fee || 0.0)
			).toFixed(2);


			const amountPayable = orderDetails.waiver ? (grandTotal - orderDetails.waiver.amount).toFixed(2) : grandTotal; // amountPayable can be later adjusted by the payments service.
			// grandTotal and amountPayable used to be treated as a singular field by the logistics app. After payments integration they are separate fields.
			// This is just a representational change, only effects the getBatches API.
			grandTotal = orderDetails.waiver ? (grandTotal - orderDetails.waiver.amount).toFixed(2) : grandTotal;
      sails.log.info(`parseBatchOrders() Order Details: ${JSON.stringify(orderDetails)}`);
			orderObj = {
				"id": orderDetails.id,
				"total_price": orderDetails.total_price,
				"placed_at": orderDetails.placed_at,
				"cash_received": Math.round(orderDetails.cash_received * 100) / 100,
				"tax": orderDetails.tax,
				"coupon": orderDetails.coupon_id ?
					{
						"discount_value": orderDetails.coupon_id.discount_value,
						"discount_type": orderDetails.coupon_id.discount_type,
						"min_coupon_limit": orderDetails.coupon_id.min_coupon_limit,
						"max_discount_value": orderDetails.coupon_id.max_discount_value,
						// adding additional fields as per frontend requirement
						"name": orderDetails.coupon_id.name,
						"id": orderDetails.coupon_id.id || orderDetails.coupon_id
					} : null,
				"waiver": orderDetails.waiver ? orderDetails.waiver : null,
				"sub_total": subTotal,
				"service_charge": serviceCharge,
				"delivery_charge": deliveryCharge,
				"grand_total": grandTotal,
				"coupon_discount": orderDetails.coupon_discount + orderDetails.volume_based_discount,
				"delivery_priority": batchOrder.delivery_priority,
				"status_id": orderDetails.status_id.id,
				"status_name": orderDetails.status_id.name,
				"customer": {
					"id": orderDetails.customer_id.id,
					"name": orderDetails.customer_id.name,
					"address": orderDetails.customer_id.address,
					"cnic": orderDetails.customer_id.cnic,
					"cnic_picture": orderDetails.customer_id.cnic_picture,
					"phone": orderDetails.customer_id.phone,
					"location": (orderDetails.customer_address_id && orderDetails.customer_address_id.location_cordinates) ? JSON.parse(orderDetails.customer_address_id.location_cordinates) : null,
					"address_line_1": orderDetails.customer_address_id ? orderDetails.customer_address_id.address_line_1 : '',
					"city_area": orderDetails.customer_address_id ? orderDetails.customer_address_id.city_area : ''
				},
				"store_id": orderDetails.location_id.id,
				"store_name": orderDetails.location_id.name,
				"country_code": countryCode ? countryCode : null,
				"shop_id": shopDetails ? shopDetails.id : null,
				"shop_name": shopDetails ? shopDetails.shop_name : null,
				"shop_picture": shopDetails ? shopDetails.shop_picture : null,
				"items": items,
				"amountPayable": amountPayable,
				"payment_type": orderDetails.payment_type,
				"credit_buy_fee": orderDetails.credit_buy_fee || 0
			};
			resolve(orderObj);
		}
		catch (err) {
			sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.parseAgentOrders() -> ${JSON.stringify(err.stack)}, Order object: ${JSON.stringify(orderDetails)}`);
			reject(err);
		}
	})
};

const deleteBatch = async (meta, batch) => {
	try {
		let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
		meta.caller = 'BatchService.delete()';
		sails.log.info(`${logIdentifier} In BatchService.delete()`);

		return new Promise(async (resolve, reject) => {
			try {
				let deleteBatchFlag = false;
				let batchStatus = await getBatchByIdFromDB({
					where: batch.id,
					select: ['status_id']
				});

				// check if the batch is deletable
				if (
					batchStatus !== undefined &&
					batchStatus.status_id < Constants.DeliveryBatchStates.ACCEPTED
				) {
					let batchOrders;
					let nonIntransitOrders;

					// check if the batch is deletable when it is already in accepted state
					if (batchStatus.status_id < Constants.DeliveryBatchStates.ACCEPTED) {
						deleteBatchFlag = true;
					}
					else {
						batchOrders = await getBatchOrdersFromDB({
							where: { batch_id: batch.id },
							select: ['order_id']
						});

						let batchOrderIds = batchOrders.map(x => x.order_id);

						// get any of the orders that has been moved from in-transit
						nonIntransitOrders = await Order.find({
							where: {
								id: batchOrderIds,
								status_id: { '!=': Constants.HyprOrderStates.IN_TRANSIT }
							},
							select: ['status_id']
						});

						if (nonIntransitOrders.length === 0) {
							deleteBatchFlag = true;
						}
					}

					if (deleteBatchFlag) {
						if (batchOrders === undefined) {
							batchOrders = await getBatchOrdersFromDB({
								where: { batch_id: batch.id },
								select: ['order_id']
							});
						}

						// delete batchOrders
						let deletedBatchOrders = await DeliveryBatchOrder.update({
							batch_id: batch.id
						}).set({
							deleted_at: GeneralHelper.dateObjectToMySqlDateConversion(new Date)
						}).fetch();

						// delete batch
						let deletedBatch = await DeliveryBatch.updateOne({
							id: batch.id,
						}).set({
							deleted_at: GeneralHelper.dateObjectToMySqlDateConversion(new Date),
							status_id: Constants.DeliveryBatchStates.CANCELLED
						});

						// revert orders status to packed
						// we may use promise.all() for it but I have reservations as it may exhaust the DB connection pool
						for (const batchOrder of batchOrders) {
							await Order.updateAndCreateHistory(
								{ id: batchOrder.order_id },
								{
									status_id: Constants.HyprOrderStates.PACKED,
									delivery_boy_id: null,
								},
								meta?.userData?.id,
								Constants.HyprRoles.getKeyFromValue(meta.userData.role.id)
							);
							sails.log(`${logIdentifier} Order ID: ${batchOrder.order_id} status got changed to Packed`);
						}
						 await deletebatch({
							url: `${GROWTH_SERVICE_BASE_URL}${DELETE_BATCH}${batch.id}`,
							headers: {
							  Authorization: await createServiceToken(),
							},
						  });
						resolve(deletedBatch);
					}
					else {
						reject(`cannot delete batch as order/s -> ${JSON.stringify(nonIntransitOrders)} has/have passed the InTransit state`);
					}
				}
				else {
					let response = 'Batch not in pending state!!';
					if (batchStatus === undefined) {
						response = 'Batch has already been deleted or it does not exist';
					}
					sails.log(response);
					reject(response);
				}
			}
			catch (err) {
				sails.log.error(`${logIdentifier} Error in BatchService.delete() -> ${JSON.stringify(err.stack)}`);
				reject(err);
			}
		});
	}
	catch (err) {
		sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.delete() -> ${JSON.stringify(err.stack)}`);
		throw err;
	}
};

const updateBatchQueue = async (orderId, orderType=null) => {
	try {
		sails.log.info(`updateBatchQueue handler called with orderId: ${orderId}`);
		let updatedBatch = {};

		let orderBatches = await DeliveryBatchOrder.find({
			where: {
				order_id: orderId,
				deleted_at: null
			},
			select: ["batch_id"]
		})
			.populate("batch_id")

		let orderBatch = orderBatches.filter(x => x.batch_id.status_id <= 5);

		if (orderBatch.length === 1) {
			let batchOrders = await DeliveryBatchOrder.find({
				where: {
					batch_id: orderBatch[0].batch_id.id,
					deleted_at: null
				}
			});

			let closeBatch = true;
			let currentOrderStatus = 0;
			for (let batchOrder of batchOrders) {
				let orderStatus = await Order.findOne({
					where: { id: batchOrder.order_id },
					select: ["status_id"]
				});
				sails.log(`currentOrderStatus: ${currentOrderStatus}, batchOrderId: ${batchOrder.order_id}, orderId: ${orderId}, orderStatus.status_id: ${orderStatus.status_id} `);
				if (batchOrder.order_id == orderId) currentOrderStatus = orderStatus.status_id;
				if (orderStatus.status_id == 5) closeBatch = false;
			}
			sails.log(`closeBatch after iterating over orders: ${closeBatch}`);
			if (closeBatch) {
				updatedBatch.status_id = 5;
				updatedBatch.completed_at = new Date();
			}

			sails.log(`currentOrderStatus after iterating over orders: ${currentOrderStatus}, order id: ${orderId}`);
			let isRed = false;
			let isRgtInProgress = false;
			if (currentOrderStatus == Constants.HyprOrderStates.PARTIAL_DELIVERED ||
				currentOrderStatus == Constants.HyprOrderStates.DELIVERED ||
        currentOrderStatus == Constants.HyprOrderStates.CANCELLED
			) {
				let batchProducts = JSON.parse(orderBatch[0].batch_id.products);
        sails.log.info(`updateBatchQueue() Batch products for batch id ${orderBatch[0].batch_id.id} are: ${JSON.stringify(batchProducts)}`);
				let orderItems = await OrderItems.find({
					where: { order_id: orderId },
					select: ["product_id", "quantity", "packed_quantity"]
				});
        sails.log.info(`updateBatchQueue() Order items for batch id ${orderBatch[0].batch_id.id} and order id: ${orderId} are: ${JSON.stringify(orderItems)}`)

				for (let item of orderItems) {
          sails.log.info(`updateBatchQueue() Product quantity for batch id ${orderBatch[0].batch_id.id}, order id: ${orderId} and product id: ${item.product_id} is: ${item.quantity}`);
					let productIndex = batchProducts.findIndex(x => +x.id === +item.product_id || +x.id === +item.id);
          sails.log.info(`updateBatchQueue() Product index for batch id ${orderBatch[0].batch_id.id}, order id: ${orderId} and product id: ${item.product_id} is: ${productIndex}`);
					if (productIndex >= 0) {
            if (currentOrderStatus === Constants.HyprOrderStates.CANCELLED) {
              item.quantity = 0;
            }
						if (batchProducts[productIndex].current_quantity >= item.quantity) {
              sails.log.info(`updateBatchQueue() Batch item quantity before calculation for batch id ${orderBatch[0].batch_id.id} and product id: ${batchProducts[productIndex].id} is: ${batchProducts[productIndex].current_quantity}`);
              batchProducts[productIndex].current_quantity -= item.quantity;
							if (orderType == SPOT_ORDER){
							  batchProducts[productIndex].spot_current_quantity -= item.quantity;
							}
              if (currentOrderStatus === Constants.HyprOrderStates.PARTIAL_DELIVERED || currentOrderStatus === Constants.HyprOrderStates.CANCELLED) {
                let undeliveredQuantity = item.packed_quantity - item.quantity;
                if (batchProducts[productIndex].ordered_quantity_difference > 0) {
                  batchProducts[productIndex].spot_current_quantity += (undeliveredQuantity - batchProducts[productIndex].ordered_quantity_difference);
                  if (batchProducts[productIndex].ordered_quantity_difference > undeliveredQuantity) {
                    batchProducts[productIndex].ordered_quantity_difference -= undeliveredQuantity;
                  } else {
                    batchProducts[productIndex].ordered_quantity_difference = 0;
                  }
                } else {
                  batchProducts[productIndex].spot_current_quantity = (batchProducts[productIndex].spot_current_quantity || 0) + undeliveredQuantity;
                }
              }

              if (batchProducts[productIndex].current_quantity < batchProducts[productIndex].spot_current_quantity){
                batchProducts[productIndex].spot_current_quantity = batchProducts[productIndex].current_quantity;
              }

              sails.log.info(`updateBatchQueue() Batch item quantity after calculation for batch id ${orderBatch[0].batch_id.id} and product id: ${batchProducts[productIndex].id} is: ${batchProducts[productIndex].current_quantity}`);
						} else {
							sails.log.error(`product: ${item.product_id} stock available is less that delivered quantity, items were not subtracted`);
						}
					}
					else {
						sails.log.error(`product: ${item.product_id} was not found in batch products, items were not subtracted`);
					}
				}
				if (process.env.ALLOW_RTG_APP_FLOWS == "true") {
					if (orderBatch[0].batch_id.rtg_status_id === IN_PROGRESS) {
						batchProducts.forEach((product) => {
							if (product.received_quantity + product.damages !== product.current_quantity) {
								isRed = true;
								if (product.received_quantity + product.damages > product.current_quantity) {
									isRgtInProgress = true;
								}
							}
						});
					}
					updatedBatch.rtg_status_id = isRgtInProgress ? IN_PROGRESS : DONE;
					updatedBatch.is_red = isRed;
				}
				updatedBatch.products = JSON.stringify(batchProducts);
			}

      sails.log.info(`Batch is updating in updateBatchQueue(). Batch Id: ${orderBatch[0].batch_id.id}, Batch data: ${JSON.stringify(updatedBatch)}, order id: ${orderId} `);

			updateBatchRes = await DeliveryBatch.updateOne({ id: orderBatch[0].batch_id.id })
				.set(updatedBatch);

      sails.log.info(`Batch updated in updateBatchQueue(). Batch Id: ${orderBatch[0].batch_id.id}, Updated batch data: ${JSON.stringify(updateBatchRes)}, order id: ${orderId}`);
			/**
			 * this will not be working here before as we are sending stringified products and iterating
			 * over them in the syncBatchReturnData function, Don't know how it gets through testing
			 */
			if (closeBatch) {
				// OdooService.syncBatchReturnData(updateBatchRes);
				createBatchHistory({
				batchId: orderBatch[0].batch_id.id,
				type: BATCH_HISTORY_TYPES.COMPLETED,
				oldJSON: orderBatch[0].batch_id,
				newJSON: updateBatchRes,
				});
			}
			try {
				await updateGrowthBatchJob(orderId, batchOrders, orderBatch[0].batch_id.id);
			} catch (error) {
				sails.log.error(`updateBatchQueue() error in updateGrowthBatchJob -> ${JSON.stringify(error)}`);
			}

			return updateBatchRes;
		}
		else if (orderBatch.length > 1) {
			sails.log.warn(`More than one active batches exist for order: ${orderId}`);
		}
		else {
			sails.log.warn(`Batch does not exists for order: ${orderId} or it is not in active state`);
		}
	}
	catch (err) {
		sails.log.error(`updateBatchQueue() experienced an error -> ${JSON.stringify(err.stack)}`);
		throw err;
	}
}

const updateGrowthBatchJob = async (orderId, batchOrders, batchId) => {
	const currentOrder = await findOrder(orderId);
	const batchOrderIds = batchOrders.map(batchOrders => batchOrders.order_id);
	const allOrders = await findOrders({id: batchOrderIds});
	const currentCustomerOrders = allOrders.filter(order => order.customerId === currentOrder.customerId);
	const orderEndStatuses = [
		Constants.HyprOrderStates.PARTIAL_DELIVERED,
		Constants.HyprOrderStates.DELIVERED,
		Constants.HyprOrderStates.CANCELLED,
		Constants.HyprOrderStates.ON_HOLD,
	];

	let jobCompleted = true, isAnyOrderInEndState = false;
	for (let order of currentCustomerOrders) {
		if (!orderEndStatuses.includes(order.statusId)) {
			jobCompleted = false;
		}
		if (!isAnyOrderInEndState && orderEndStatuses.includes(order.statusId)) {
			isAnyOrderInEndState = true;
		}
	}

	const calculatTarget = (orders = []) => {
		return _.sumBy(orders, obj => (+obj.cashReceived || +obj.totalPrice) - (+obj.deliveryChargeValue + +obj.serviceChargeValue));
	};

	if (jobCompleted || isAnyOrderInEndState) {
		await updateJob({
			url: `${GROWTH_SERVICE_BASE_URL}${UPDATE_JOB}${batchId}`,
			data: {
				jobCompleted,
        customerId: currentOrder.customerId,
				target: calculatTarget(currentCustomerOrders) || 0,
      },
			headers: {
				Authorization: await createServiceToken(),
			}
		});
	}
}

const readAndValidateStreamData = async (meta, file_name) => {
	return new Promise(async (resolve, reject) => {
		try {
			const s3 = new AWS.S3({
				region: 'me-south-1'
			});
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
			meta.caller = 'BatchService.readAndValidateStreamData()';
			sails.log.info(`${logIdentifier} In readAndValidateStreamData()`);
			const s3Options = {
				Bucket: sails.config.globalConf.AWS_BUCKET,
				Key: file_name,
			};
			const stream = s3.getObject(s3Options).createReadStream();

			let CSVData = await validateStreamDataAndParseToArray(stream);

			resolve(CSVData);
		} catch (err) {
			sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.readAndValidateStreamData() -> ${JSON.stringify(err.stack || err)}`);
			err.sendResponse = true;
			reject(err);
		}
	});
};

const validateStreamDataAndParseToArray = (stream) => {
	return new Promise(async (resolve, reject) => {
		try {
			let allCSVData = [];
			let firstLine = true;
			let reg = new RegExp('^[0-9]+$');
			let sanityTest = true;
			let sanityMessage = '';
			stream.pipe(csv()
				.on("data", async (data) => {
					if (firstLine) {
						firstLine = false;
					} else {
						allCSVData.push(data);
					}
				})
				.on("end", () => {
					for (let data of allCSVData) {
            for(i = 0; i < data.length; i++) {
              const value = data[i];
              if (i === 0 || i === 1) {
                if (value === null || value === '' || !reg.test(value)) {
                  sanityMessage = i === 0 ? "Invalid reference id" : "Invalid agent id";
                  sanityTest = false;
                  break;
                }
              }
              if (i === 2 && data[4] === 'order') {
                if (value === null || value === '' || !reg.test(value)) {
                  sanityMessage = "Invalid priority";
                  sanityTest = false;
                  break;
                }
              }
              if (i === 3 && data[4] === 'product') {
                if (value === null || value === '' || !reg.test(value)) {
                  sanityMessage = "Invalid quantity";
                  sanityTest = false;
                  break;
                }
              }
              if (i === 4) {
                if (value === null || value === '' || !(value === Constants.BATCH_CSV_TYPES.ORDER || 
                value === Constants.BATCH_CSV_TYPES.PRODUCT)) {
                  sanityMessage = "Invalid tpye";
                  sanityTest = false;
                  break;
                }
              }
            }

						if (!sanityTest) {
							break;
						}
					}
					if (!sanityTest) {
						reject(sanityMessage);
					}
					resolve(allCSVData)
				})
			);
		}
		catch (err) {
			reject(err);
		}
	});
};

const buildDataForBatchCreation = async (meta, streamDataArray) => {
	return new Promise(async (resolve, reject) => {
		try {
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
			meta.caller = 'BatchService.buildDataForBatchCreation()';
			sails.log.info(`${logIdentifier} In buildDataForBatchCreation()`);
      let csvData = [];
			async.eachSeries(
				streamDataArray,
				async (data, callback) => {
					let	referenceId = +data[0];
					let	agentId = +data[1];
					let	priority = data[2] ? +data[2] : null;
          let quantity = data[3] ? +data[3] : null;
          let type = data[4];

          let agentExists = false
          let agentIndex;
          for (i = 0; i < csvData.length; i++) {
            if (agentId === csvData[i].agentId) {
              agentExists = true;
              agentIndex = i;
              break;
            }
          }

          if (agentExists) {
            if (type === Constants.BATCH_CSV_TYPES.ORDER) {
              csvData[agentIndex].orders[priority - 1] = referenceId;
            } else {
              csvData[agentIndex].products.push({
                id: referenceId,
                quantity: quantity,
              });
            }
          } else {
            let batchData = {
              agentId: agentId,
              orders: [],
              products: [],
            }
            if (type === Constants.BATCH_CSV_TYPES.ORDER) {
              batchData.orders[priority - 1] = referenceId;
            } else {
              batchData.products.push({
                id: referenceId,
                quantity: quantity,
              });
            }
            csvData.push(batchData);
          }
					callback();
				}
			);
			csvData = removeEmptyOrderIds(csvData);

			resolve(csvData);
		} catch (err) {
			sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.buildDataForBatchCreation() -> ${JSON.stringify(err.stack)}`);
			err.mailMessage = 'Something went wrong on the server, Please try again later';
			reject(err);
		}
	});

};

const removeEmptyOrderIds = (sortedCSVData) => {
	try {
		let antiNullArray = []
		for (let data of sortedCSVData) {
			data.orders = data.orders.filter(orderId => orderId ? true : false);
			antiNullArray.push(data);
		}
		return antiNullArray;
	}
	catch (err) {
		throw err;
	}
};

const checkBatchOrdersStatusAndLocation = async (meta, orderIds, orders, locationId) => {
	return new Promise(async (resolve, reject) => {
		try {
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
			meta.caller = 'BatchService.checkBatchOrderStatus()';
			sails.log.info(`${logIdentifier} In checkBatchOrderStatus()`);

			if (orders.length == orderIds.length) {
				let badOrders = orders.filter(order => (order.status_id != Constants.HyprOrderStates.PACKED || order.location_id != locationId));

				if (badOrders.length) {
					sails.log.error(`${logIdentifier} Error in BatchService.checkBatchOrderStatus() -> Order/s: ${JSON.stringify(badOrders)} is/are not in 'packed' state or it/they does/do not belong to location: ${locationId}`);
					reject({ mailMessage: `Order/s: ${JSON.stringify(badOrders)} is/are not in packed state or it/they does not belong to location: ${locationId}` });
				}
				else {
					resolve("Order statuses and locations checked");
				}
			}
			else {
				let ordersDifference = [];
				if (!_.isEmpty(orders)) {
					orders = orders.map(x => x.id);
					ordersDifference = orderIds.filter(x => orders.indexOf(parseInt(x)) === -1);
				}
				else {
					ordersDifference = orderIds;
				}
				sails.log.error(`${logIdentifier} Error in BatchService.checkBatchOrderStatus() -> Order ID/s: ${ordersDifference} was/were not found`);
				reject({
					mailMessage: `Order/s: ${ordersDifference} was/were not found`
				});
			}

		} catch (err) {
			sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.checkBatchOrderStatus() -> ${JSON.stringify(err.stack)}`);
			err.mailMessage = 'Something went wrong on the server, Please try again later';
			reject(err);
		}
	});
};

const checkBatchSpotProducts = async (meta, batchProducts, products, locationId) => {
  return new Promise(async (resolve, reject) => {
		try {
      let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
			meta.caller = 'BatchService.checkBatchSpotProducts()';
			sails.log.info(`${logIdentifier} In checkBatchSpotProducts()`);
      if (batchProducts.length === products.length) {
				const badProducts = products.filter(product => product.locationId !== +locationId || product.disabled === true).map(product => product.id);;
				if (badProducts && badProducts.length) {
					reject({ mailMessage: `Product/s: ${JSON.stringify(badProducts)} is disabled or does/do not belong to location: ${locationId}` });
				}
				else {
					resolve("Order statuses and locations checked");
				}
			} else {
        const productIds = products.map(product => product.id);
        const batchProductIds = batchProducts.map(product => product.id);
        const productDifference = batchProductIds.filter(batchProductId => !productIds.includes(batchProductId));
				reject({
					mailMessage: `Products/s: ${productDifference} was/were not found`
				});
			}
    } catch (err) {
			err.mailMessage = `Error in BatchService.checkBatchSpotProducts() -> ${JSON.stringify(err.stack)}`;
			reject(err);
		}
  });
};

const sendCustomerNotification = async (meta, orders) => {
	return new Promise(async (resolve, reject) => {
		try {
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
			meta.caller = 'BatchService.sendCustomerNotification()';
			sails.log.info(`${logIdentifier} In sendCustomerNotification()`);
			for (order of orders) {
				order["grand_total"] = order.total_price
					? parseFloat(order.total_price - order.coupon_discount)
					: 0.0;
				OrderService.sendCustomerNotification(
					order.customer_id,
					Constants.HyprNotificationType.DELIVERY_ASSIGNED,
					order,
					order["grand_total"]
				);
			}
			resolve({
				message: "Message noticification sent"
			})
		} catch (err) {
			sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.sendCustomerNotification() -> ${JSON.stringify(err.stack)}`);
			err.mailMessage = 'Something went wrong while sending notification to customers, Batch created';
			reject(err);
		}
	});
};

const sendBatchMail = async (meta, errors) => {
	return new Promise(async (resolve, reject) => {
		try {
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller},`;
			meta.caller = 'BatchService.sendBatchMail()';
	  sails.log(`${logIdentifier} called with errors -> ${JSON.stringify(errors)}`);

			var html = "";
			if (errors === "") {
				html = "<h2>BATCHES CREATED SUCCESSFULLY</h2>";
			} else {
				html = "<h2>BATCHES CREATION FAILED</h2>";
				html += "<p>" + "REASON: " + errors + "</p>";
			}
			let user = await AuthStoreService.populateHierarchyAccess(
				meta.userData
			);
			let recipients = await UtilService.getAccountEmails(user);
			if (meta.userData.email && meta.userData.email != "")
				recipients.push(meta.userData.email);
			// MailerService.sendMailThroughAmazon({
			// 	email: recipients,
			// 	htmlpart: html,
			// 	subject: "BULK BATCHES CREATION REPORT - " + new Date(),
			// 	destination: "operations@hypr.pk",
			// });
			resolve();
		} catch (err) {
			sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta?.userData?.id}, context: ${meta.caller}, Error in BatchService.sendBatchMail() -> ${JSON.stringify(err.stack)}`);
			resolve(err);
		}
	});
};

module.exports = {
	createBatch,
	readAndValidateStreamData,
	bulkCreateBatches,
	sendBatchMail,
	getBatchesForAdmin,
	getBatchesForAgent,
	getOrdersByBatch,
	updateAndAccept,
	deleteBatch,
	updateBatchQueue,
	updateOrdersAgentAndStatus,
	getFormattedDataForOrders,
	getOrdersBreakdown
};
