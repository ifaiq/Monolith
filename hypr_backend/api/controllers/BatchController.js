const BatchService = require("../services/BatchService");
const { checkLogisticsAppVersion } = require("../services/AuthService")

module.exports = {
	createBatch: async function (req, res, next) {
		try {
			let params = req.allParams();
			let meta = {
				reqId: params.id,
				userData: res.locals.userData || 'N/A',
				caller: "BatchController.createBatches()",
				clientTimeOffset: params.clientTimeOffset
			};
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${req.url},`;
			sails.log.info(`${logIdentifier} In BatchController.createBatch()`);

			let batches = await BatchService.createBatch(meta, params.orderIds, params.agentId, params.locationId);
			res.ok(batches);
		}
		catch (err) {
			sails.log.error(`ReqID: ${req.allParams().id}, UserID: ${res.locals.userData.id}, context: ${req.url}, Error in BatchController.createBatch() -> ${JSON.stringify(err.stack || err)}`);
			res.serverError(err);
		}
	},

	bulkCreateBatches: async function (req, res, next) {
		try {
			let params = req.allParams();
			let meta = {
				reqId: params.id,
				userData: res.locals.userData || 'N/A',
				caller: "BatchController.bulkCreateBatches()"
			};
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${req.url},`;
			sails.log.info(`${logIdentifier} In BatchController.bulkCreateBatches()`);

			let readStreamData = await BatchService.readAndValidateStreamData(meta, params.file_name);
			res.ok();
			await BatchService.bulkCreateBatches(meta, readStreamData, params.location_id);
		}
		catch (err) {
			sails.log.error(`ReqID: ${req.allParams().id}, UserID: ${res.locals.userData.id}, context: ${req.url}, Error in BatchController.bulkCreateBatches() -> ${JSON.stringify(err.stack || err)}`);

			if (err.sendMail) {
				try {
					let meta = {
						reqId: req.allParams().id,
						userData: res.locals.userData || 'N/A',
						caller: "BatchController.bulkCreateBatches()"
					};
					await BatchService.sendBatchMail(meta, err.mailMessage);
				}
				catch (err) {
					sails.log.error(`ReqID: ${req.allParams().id}, UserID: ${res.locals.userData.id}, context: ${req.url}, Error in BatchController.bulkCreateBatches() -> ${JSON.stringify(err.stack || err)}`);
				}
			}
			else {
				res.serverError(err);
			}
		}
	},

	getBatches: async function (req, res, next) {
		try {
			let params = req.allParams();
			const { headers: { app_version }, user: { role } } = req;
			let meta = {
				reqId: params.id,
				userData: res.locals.userData || 'N/A',
				caller: "BatchController.getBatches()"
			};
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${req.url},`;
			sails.log.info(`${logIdentifier} In BatchController.getBatches()`);
			await checkLogisticsAppVersion(app_version, role);

			let batches = params.isAdmin == "true" ?
				await BatchService.getBatchesForAdmin(meta, params) :
				await BatchService.getBatchesForAgent(meta, params.agentId);

			res.ok(batches);
		}
		catch (err) {
			sails.log.error(`ReqID: ${req.allParams().id}, UserID: ${res.locals.userData.id}, context: ${req.url}, Error in BatchController.getBatches() -> ${JSON.stringify(err.stack || err)}`);
			res.serverError(err);
		}
	},

	getOrdersByBatch: async function (req, res, next) {
		try {
			let params = req.allParams();
			let meta = {
				reqId: params.id,
				userData: res.locals.userData || 'N/A',
				caller: "BatchController.getOrdersByBatch()"
			};
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${req.url},`;
			sails.log.info(`${logIdentifier} In BatchController.getOrdersByBatch()`);
			let orders = await BatchService.getOrdersByBatch(meta, params.batchId);
			res.ok(orders);
		}
		catch (err) {
			sails.log.error(`ReqID: ${req.allParams().id}, UserID: ${res.locals.userData.id}, context: ${req.url}, Error in BatchController.getOrdersByBatch() -> ${JSON.stringify(err.stack || err)}`);
			res.serverError(err);
		}
	},

	updateAndAccept: async function (req, res, next) {
		try {
			let params = req.allParams();
			const { headers: { app_version }, user: { role } } = req;
			const appType = req.headers['App-Type'];
			if (appType === 'RETAILOGO') { // todo: move this to constants
				let meta = {
					reqId: params.id,
					userData: res.locals.userData || 'N/A',
					caller: "BatchController.updateAndAccept()"
				};
				let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${req.url},`;
				sails.log.info(`${logIdentifier} In BatchController.updateAndAccept()`);
				await checkLogisticsAppVersion(app_version, role);

				let acceptedBatch = await BatchService.updateAndAccept(meta, params.batch);
				res.ok(acceptedBatch);
			} else {
				sails.log.error(`updateAndAccept called from logistics - sending 404`)
				res.notFound(); // this is intentional to block logistics batch acceptance
			}
		}
		catch (err) {
			sails.log.error(`ReqID: ${req.allParams().id}, UserID: ${res.locals.userData.id}, context: ${req.url}, Error in BatchController.updateAndAccept() -> ${JSON.stringify(err.stack || err)}`);
			res.serverError(err);
		}
	},

	deleteBatch: async function (req, res, next) {
		try {
			let params = req.allParams();
			let meta = {
				reqId: params.id,
				userData: res.locals.userData || 'N/A',
				caller: "BatchController.deleteBatch()"
			};
			let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${req.url},`;
			sails.log.info(`${logIdentifier} In BatchController.deleteBatch()`);
			let deletedBatch = await BatchService.deleteBatch(meta, params.batch);
			res.ok(deletedBatch);
		}
		catch (err) {
			sails.log.error(`ReqID: ${req.allParams().id}, UserID: ${res.locals.userData.id}, context: ${req.url}, Error in BatchController.deleteBatch() -> ${JSON.stringify(err.stack || err)}`);
			res.serverError(err);
		}
	}
}
