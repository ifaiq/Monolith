const {
  eInvoiceService: {
    createInvoice,
    createThermalInvoiceByOrderId,
    createCreditNoteInvoice,
    bulkCreditNotesAndInvoices,
    findLatestInvoice: findLatestInvoiceByOrderId,
  },
  eInvoiceUtils: {
    checkMultiDownloadSupport,
    checkArrayOfObjectsResponseSupport,
    checkMultiDownloadSupportLogistics,
  },
} = require("../../modules/v1/EInvoice");
const { constants: { request: { VERSIONING: { v1 } } } } = require("../../constants/http");
const {
  THERMAL_INVOICE_PAPERSIZE,
} = require("../../modules/v1/EInvoice/Constants");
const { readAndValidateStreamData } = require("../../services/BatchService");
const { HyprRoles: { SUPERVISOR } } = require("../../services/Constants");

/**
 * EInvoice controller to create invoice
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Success} return ok 200 response
 */
const postInvoice = async (req, res) => {
  const { userId, user: { role }, body, body: { orderId }, headers: { app_version, os } } = req;
  const logIdentifier = `API version: ${v1},
  context: EInvoiceController.postInvoice(),
  UserId: ${userId},
  Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(body)}`);
    const data = await createInvoice(orderId, userId, role !== SUPERVISOR);
    const isMultiDownloadSupported = checkMultiDownloadSupport(app_version, os);
    const isArrayOfObjectsResponseSupported = checkArrayOfObjectsResponseSupport(app_version, os);
    switch(true) {
      case (isArrayOfObjectsResponseSupported && (data.invoiceData ? true : false)):
        res.ok(data.path, { invoiceData: data.invoiceData });
        break;
      case (isArrayOfObjectsResponseSupported):
        res.ok(data);
        break;
      case (isMultiDownloadSupported):
        res.ok(data.map(item => item.path));
        break;
      default:
        res.ok(data[0].path);
    }
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

const getThermalInvoiceByOrderId = async (req, res) => {
  const {
    userId,
    user: { role },
    query: { orderId, paperSize = THERMAL_INVOICE_PAPERSIZE },
    headers: { app_version },
  } = req;
  const logIdentifier = `API version: ${v1},
  context: EInvoiceController.getThermalInvoiceByOrderId(),
  UserId: ${userId},
  Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with the params -> 
    orderId: ${orderId}`);
    const publishToSNS = false;
    let thermalInvoicePdfPath = await createThermalInvoiceByOrderId(
      orderId,
      paperSize,
      publishToSNS,
    );
    if (checkMultiDownloadSupportLogistics(app_version)) {
      res.ok(thermalInvoicePdfPath);
    } else {
      thermalInvoicePdfPath = thermalInvoicePdfPath.map(invoice => invoice.path);
      res.ok(thermalInvoicePdfPath);
    }
  } catch (err) {
    sails.log.error(
      `${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`,
    );
    res.error(err);
  }
};

/**
 * EInvoice controller to create credit note
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Success} return ok 200 response
 */
const postCreditNote = async (req, res) => {
  const { userId, user: { role }, body, body: { orderId } } = req;
  const logIdentifier = `API version: ${v1}, 
  context: CreditNoteController.postCreditNote(),
  UserId: ${userId}, 
  Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(body)}`);
    const invoice = await findLatestInvoiceByOrderId(orderId);
    const creditNoteInvoicePDF = await createCreditNoteInvoice(invoice.id, invoice);
    res.ok(creditNoteInvoicePDF);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

const bulkGenerateCNsAndInvoices = async function (req, res, next) {
  try {
    const params = req.allParams();
    const meta = {
      reqId: params.id,
      userData: res.locals.userData || "N/A",
      caller: "eInvoiceController.bulkGenerateCNsAndInvoices()",
    };
    const logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${req.url},`;
    sails.log.info(`${logIdentifier} In EinvoiceController.bulkGenerateCNsAndInvoices()`);
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(params)}`);

    const readStreamData = await readAndValidateStreamData(meta, params.file_name);
    sails.log(`${logIdentifier} Sanity check complete. Responded with CSV data -> ${JSON.stringify(readStreamData)}`);
    const ids = [];
    for (const id of readStreamData) {
      ids.push(id[0]);
    }
    bulkCreditNotesAndInvoices(ids, params.data_type);
    res.ok();
    // await BatchService.bulkCreateBatches(meta, readStreamData, params.location_id);
  } catch (err) {
    sails.log.error(`ReqID: ${req.allParams().id}, UserID: ${res.locals.userData.id}, context: ${req.url}, 
    Error in BatchController.bulkCreateBatches() -> ${JSON.stringify(err.stack || err)}`);

    if (err.sendMail) {
      try {
        // eslint-disable-next-line no-unused-vars
        const meta = {
          reqId: req.allParams().id,
          userData: res.locals.userData || "N/A",
          caller: "bulkGenerateCNsAndInvoices()",
        };
      } catch (error) {
        sails.log.error(`ReqID: ${req.allParams().id}, UserID: ${res.locals.userData.id}, context: ${req.url}, 
        Error in bulkGenerateCNsAndInvoices() -> ${JSON.stringify(error.stack || error)}`);
      }
    } else {
      res.serverError(err);
    }
  }
};

module.exports = {
  postInvoice,
  getThermalInvoiceByOrderId,
  postCreditNote,
  bulkGenerateCNsAndInvoices,
};

