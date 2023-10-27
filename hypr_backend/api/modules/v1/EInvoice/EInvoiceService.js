/* eslint-disable max-len */
/* eslint-disable consistent-return */
const {
  SELLER,
  ZONE,
  DATE_TIME_FORMAT,
  THERMAL_INVOICE_PAPERSIZE,
  EINVOICE_QR_CONFIG,
  THERMAL_INVOICE_QR_CONFIG,
  EINVOICE_VERSIONING,
  CN_TAX_INVOICE,
  SELLER_UAE,
  COUNTRY_CODES,
  TAX_RATES,
  DELIVERY_FEE_TITLE,
  SERVICE_FEE_TITLE,
} = require("./Constants");
const moment = require("moment-timezone");
const { getLastInvoiceNumber, create, findManyByOrderId, findLatestInvoiceByOrderId, findByCheckedId, findByCriteria }
  = require("./EInvoiceDao");
const CreditNoteInvoiceDao = require("./CreditNoteInvoiceDao");
const { validateBatchClosed } = require("../Batch/BatchValidator");
const { validateUser } = require("../Auth/UserValidator");
const { find: findOrderById, update: updateOrder } = require("../Order/OrderDao");
const { findLatestBatchStatusByOrderId, findBatchOrders } = require("../Batch/BatchService");
const { findOrderItemsByOrderIdAndPopulate } = require("../Order/OrderItemService");
const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");
const { uploadFile, getS3Url, getUniqueKey } = require("../Utils/S3Helper");
const { generateFileBuffer } = require("../Utils/PDFHelper");
const { getInvoiceCalculations, subtractVatFromTotalPrice } = require("../Arithmos/Helpers");
const { toInvoiceBuyer, toInvoiceDBObj, createInvoiceObj, createInvoiceNumberObj } = require("./EInvoiceMapper");
const { generateInvoiceNumber, parseDataFromXML, lineItemConstructorForFees } = require("./Utils");
const { generateXML } = require("./XMLBuilder");
const { findWaiverAmount } = require("../Waiver/WaiverService");
const ejs = require("ejs");
const route = require("path");
const qr = require("qr-image");
const sizeOf = require("image-size");
const { errors: { INVALID_THERMAL_INVOICE_ORDER_STATUS, INVOICE_NOT_FOUND } } = require("./Errors");
const camelcaseKeys = require("camelcase-keys");
const customerExtractionService = require("../../../user_service_extraction/customerService");
const locationExtractionService = require("../../../config_service_extraction/locationsExtraction");
const customerRetailerShopDetailsService =
  require("../../../user_service_extraction/customerRetailerShopDetailService");
const { publishMessage } = require("../../../../utils/sns-publisher");
const keys = require("../../../../utils/keys");
const { getOrCreateInvoice, generateInvoiceSerialNumber } = require("../../v1/InvoiceService");

const { businessUnitService: { getBusinessUnitById } } = require("../BusinessUnit");

const { CURRENCY_TYPES: { SAR, AED }} = require("../../../services/Constants");
/**
 *
 This function finds the last invoice number and generates a new invoice number
 */
const generateNewInvoiceNumber = async (isCreditNoteInvoice = false, countryCode) => {
  const lastInvoiceNumber = isCreditNoteInvoice ?
    await CreditNoteInvoiceDao.getLastInvoiceNumber(countryCode) :
    await getLastInvoiceNumber(countryCode);
  const newInvoiceNumber = generateInvoiceNumber(lastInvoiceNumber, isCreditNoteInvoice, countryCode);

  return newInvoiceNumber;
};

/**
 * Function is responsible for building data for invoice
 * @param {Object} invoice
 * @param {Date} deliveredTime
 * @returns {Object} invoice
 */
const getInvoiceDates = async (invoice, deliveredTime, isCreditNoteInvoice, countryCode) => {
  invoice.issueDate = moment.tz(ZONE).format(DATE_TIME_FORMAT);
  invoice.supplyDate = deliveredTime
    ? moment.utc(deliveredTime).tz(ZONE).format(DATE_TIME_FORMAT)
    : invoice.issueDate;

  // If this is true, get the invoice serial number from the invoicing service
  if (sails.config.globalConf.GENERATE_SERIAL_FROM_INVOICING_SVC) {
    invoice.invoiceNumber = await generateInvoiceSerialNumber(createInvoiceNumberObj(invoice.orderId, isCreditNoteInvoice, countryCode));
  } else {
    invoice.invoiceNumber = await generateNewInvoiceNumber(isCreditNoteInvoice, countryCode);
  }
  return invoice;
};

const getInvoiceData = async (orderId, user, isCreditNoteInvoice, countryCode) => {
  const logIdentifier = `API version: ${v1}, Context: EInvoiceService.getInvoiceData(),`;
  sails.log(`${logIdentifier}`);
  const shop = await customerRetailerShopDetailsService.findOne({ customer_id: user.id });
  const buyer = toInvoiceBuyer(user, shop);

  // find order by order id
  const _order = await findOrderById(orderId);
  const {
    couponDiscount,
    totalPrice,
    deliveryTime,
    creditBuyFee,
    deliveryChargeValue,
    serviceChargeValue,
    volumeBasedDiscount,
  } = _order;
  const waiver = await findWaiverAmount(orderId);

  // find order items by order id
  const orderItems = await findOrderItemsByOrderIdAndPopulate(orderId);
  const taxRate = countryCode !== COUNTRY_CODES.UAE ? TAX_RATES.OTHERS_TAX_RATE : TAX_RATES.UAE_TAX_RATE;
  if (deliveryChargeValue > 0) {
    const deliveryFeeObj =
      lineItemConstructorForFees(
        deliveryChargeValue,
        countryCode !== COUNTRY_CODES.UAE ? DELIVERY_FEE_TITLE.ARABIC :  DELIVERY_FEE_TITLE.ENGLISH,
        taxRate,
      );
    orderItems.push(deliveryFeeObj);
  }
  if (serviceChargeValue > 0) {
    const serviceFeeObj =
      lineItemConstructorForFees(
        serviceChargeValue,
        countryCode !== COUNTRY_CODES.UAE ? SERVICE_FEE_TITLE.ARABIC : SERVICE_FEE_TITLE.ENGLISH,
        taxRate,
      );
    orderItems.push(serviceFeeObj);
  }
  sails.log(`${logIdentifier} OrderItems: ${JSON.stringify(orderItems)}`);
  const {
    lineItems,
    specialLineItems,
    totalVat,
    totalPriceTaxExcl,
    taxAdjustment,
    netDiscount,
    taxableAmount,
    totalAmount,
    totalDiscount,
    ajilHandlingFee,
  } = getInvoiceCalculations(orderItems,
    couponDiscount, totalPrice, waiver, creditBuyFee, volumeBasedDiscount ?? 0, countryCode);

  const sellerData = countryCode === "UAE" ? SELLER_UAE : SELLER;

  let invoiceData = {
    orderId,
    seller: sellerData,
    buyer,
    lineItems,
    specialLineItems,
    totalTax: totalVat,
    totalDiscount,
    totalAmount,
    totalPriceTaxExcl,
    taxAdjustment,
    netDiscount,
    taxableAmount,
    ajilHandlingFee,
    countryCode,
  };

  invoiceData = await getInvoiceDates(invoiceData, deliveryTime, isCreditNoteInvoice, countryCode);
  sails.log(`${logIdentifier} invoiceNumber: ${invoiceData.invoiceNumber}`);

  invoiceData.vatExclusiveTotalAmount = subtractVatFromTotalPrice(
    totalPrice,
    totalVat,
  );

  return invoiceData;
};

const getPdfOptionsForInvoice = async (
  pdfType,
  paperSize,
  customerType,
  versionParam,
  isCreditNote = false) => {
  // The following conditions are going to be used when generating credit note of an existing invoice
  // 's' will determine whether the generated invoice is simplified one or not
  const isSimplified = versionParam?.includes("s");
  // version will be used to go the right directory for file template
  const version = isSimplified ? versionParam?.slice(0, -1) : versionParam;
  let fileType = "pdfTemplate";
  let thermalFileType = "pdfTemplateKSA";
  if(isCreditNote) {
    // If the flow is for credit note, then check the already generated invoice's type using isSimplified boolean
    fileType = isSimplified ? "simplifiedTaxInvoice" : "pdfTemplate";
    thermalFileType = isSimplified ? "simplifiedPdfTemplateKSA" : "pdfTemplateKSA";
  } else {
    // Else generate a new invoice
    fileType = customerType === "Individual" ? "simplifiedTaxInvoice" : "pdfTemplate";
    thermalFileType = customerType === "Individual" ? "simplifiedPdfTemplateKSA" : "pdfTemplateKSA";
  }
  const pdfOptions = {
    eInvoice: {
      options: {
        format: paperSize,
      },
      // eslint-disable-next-line max-len
      templatePath: route.join(__dirname, `../Ejs/Invoices/${version}/${fileType}.ejs`),
    },
    thermal: {
      options: {
        width: paperSize,
      },
      templatePath: route.join(
        __dirname,
        // eslint-disable-next-line max-len
        `../Ejs/Invoices/thermalInvoice/${thermalFileType}.ejs`,
      ),
    },
    default: {
      options: {},
      templatePath: "",
    },
  };

  return pdfOptions[pdfType] || pdfOptions.default;
};


const getPdfOptionsForDubaiInvoice = async (pdfType, paperSize, version, invoiceData = {}) => {
  const pdfOptions = {
    eInvoice: {
      options: {
        format: paperSize,
      },
      templatePath: route.join(__dirname, `../Ejs/Invoices/${version}/dxBuyPdfTemplate.ejs`),
    },
    thermal: {
      options: {
        width: paperSize,
      },
      templatePath: route.join(
        __dirname,
        `../Ejs/Invoices/thermalInvoice/pdfTemplateDubai.ejs`,
      ),
    },
    default: {
      options: {},
      templatePath: "",
    },
  };

  return pdfOptions[pdfType] || pdfOptions.default;
};


/**
 * Function is responsible for redering HTML for Invoice
 * @param {Object} data
 * @returns {Object} response
 */
const renderHtmlForPdf = async (data = {}, templatePath) => {
  const logIdentifier = `API version: ${v1}, Context: EInvoiceService.renderHtmlForPdf(),`;
  sails.log(`${logIdentifier}`);

  return new Promise((resolve, reject) => {
    ejs.renderFile(templatePath, { invoice: data }, (err, html) => {
      if (err) {
        reject(err);
      }
      resolve(html);
    });
  });
};

const uploadInvoicePdfAndXml = async (
  pdfBuffer,
  xmlBuffer,
  uniqueKey,
  invoiceData,
) => {
  const logIdentifier = `API version: ${v1}, Context: EInvoiceService.uploadInvoicePdfAndXml(),`;
  try {
    sails.log(`${logIdentifier}`);
    const invoice = invoiceData;
    const { key, path } = await uploadFile(pdfBuffer, uniqueKey, "pdf");
    sails.log(`${logIdentifier} key: ${key} path: ${path}`);
    invoice.pdfPath = key;
    invoice.eInvoicePdfUrl = path;

    const xmlResult = await uploadFile(xmlBuffer, null, "xml");
    sails.log(`${logIdentifier} key: ${xmlResult.key} path: ${xmlResult.path}`);
    invoice.xmlPath = xmlResult.key;
    return invoice;
  } catch (err) {
    sails.log.error(`${logIdentifier} Error: ${err}`);
    throw err;
  }
};

const saveInvoice = async (uploadedInvoice, user, isCreditNoteInvoice) => {
  const logIdentifier = `API version: ${v1}, Context: EInvoiceService.saveInvoice(),`;
  sails.log(`${logIdentifier}`);
  const invoiceDBObj = toInvoiceDBObj(uploadedInvoice, user);
  if (isCreditNoteInvoice) {
    invoiceDBObj.title = CN_TAX_INVOICE;
    invoiceDBObj.invoiceId = uploadedInvoice.invoiceId;
    await CreditNoteInvoiceDao.create(invoiceDBObj);
  } else {
    invoiceDBObj.json = { ...uploadedInvoice, ...invoiceDBObj, qr: undefined };
    await create(invoiceDBObj);
  }
};

const markInvoiceDownloadedForOrder = async (orderId, isInvoiceDownloaded = true) =>
  await updateOrder(orderId, { isInvoiceDownloaded });

/**
 * This function is responsible for generating and uploading E-invoice's Pdf and Xml
 * @param {Object} invoiceData
 * @param {uniqueKey} uniqueKey
 * @returns {Object} InvoiceData with E-invoice Pdf and Xml paths
 */
const generateAndUploadEinvoiceToS3 = async (
  invoiceData,
  uniqueKey,
  customerType,
  publishToSNS = true,
  version = EINVOICE_VERSIONING.latest,
  isCreditNote = false,
) => {
  try {
    const logIdentifier = `API version: ${v1}, Context: EInvoiceService.generateAndUploadEinvoiceToS3(),`;
    sails.log(`${logIdentifier}`);
    // If invoicing service flag is enabled
    if (sails.config.globalConf.IS_INVOICING_SYNC_ENABLED) {
      invoiceData.paperSize = "A4";
      invoiceData.version = version;
      invoiceData.customerType = customerType;
      // Publishing to or Creating from the Invoicing service
      createOrPublishInvoice(publishToSNS, "FULL_TAX", invoiceData, isCreditNote);
    }
    const checkCountry = invoiceData?.invoiceNumber?.includes("KSA") ? "Saudi" : "Dubai";
    const { options, templatePath } =  checkCountry === "Saudi" ?
      await getPdfOptionsForInvoice("eInvoice", "A4", customerType, version, isCreditNote) :
      await getPdfOptionsForDubaiInvoice("eInvoice", "A4", version, invoiceData);
    const htmlInvoice = await renderHtmlForPdf(invoiceData, templatePath);
    const pdfBuffer = await generateFileBuffer(htmlInvoice, options);
    const xmlBuffer = await generateXML(`${invoiceData.invoiceNumber}.xml`, invoiceData);

    // upload E-invoice Pdf and Xml to S3 bucket
    const uploadedInvoice = await uploadInvoicePdfAndXml(pdfBuffer, xmlBuffer, uniqueKey, invoiceData);
    return uploadedInvoice;
  } catch (err) {
    throw err;
  }
};

const getDimensionsForPdf = async (htmlBuffer, paperSize) => {
  const options = {
    width: paperSize,
    type: "png",
  };

  try {
    const pngFile = await generateFileBuffer(htmlBuffer, options);
    const dimensions = sizeOf(pngFile);

    return dimensions;
  } catch (err) {
    throw err;
  }
};

/**
 * This function is responsible for generating and uploading Thermal invoice's Pdf
 * @param {Object} invoiceData
 * @param {string} paperSize
 * @returns {Object} InvoiceData with thermal invoice's Pdf path
 */
const generateAndUploadThermalInvoiceToS3 = async (
  invoiceData,
  customerType,
  paperSize = THERMAL_INVOICE_PAPERSIZE,
  publishToSNS = true,
  version = EINVOICE_VERSIONING.latest,
  isCreditNote = false,
) => {
  try {
    const logIdentifier = `API version: ${v1}, Context: EInvoiceService.generateAndUploadThermalInvoiceToS3(),`;
    sails.log(`${logIdentifier}`);
    const uniqueKey = getUniqueKey();
    // If invoicing service flag is enabled
    if (sails.config.globalConf.IS_INVOICING_SYNC_ENABLED) {
      invoiceData.paperSize = paperSize;
      invoiceData.version = version;
      invoiceData.customerType = customerType;
      // Publishing to or Creating from the Invoicing service
      createOrPublishInvoice(publishToSNS, "THERMAL", invoiceData, isCreditNote);
    }
    const checkCountry = invoiceData?.invoiceNumber?.includes("KSA") ? "Saudi" : "Dubai";
    const { options, templatePath } =  checkCountry === "Saudi" ?
      await getPdfOptionsForInvoice("thermal", paperSize, customerType, version, isCreditNote) :
      await getPdfOptionsForDubaiInvoice("thermal", paperSize, null, invoiceData);
    const htmlInvoice = await renderHtmlForPdf(invoiceData, templatePath);
    const pdfDimenstions = await getDimensionsForPdf(htmlInvoice, paperSize);

    // set height for thermal invoice pdf
    options.height = pdfDimenstions.height;

    // generate PDF buffer for thermal invoice
    const thermalInvoicePdfBuffer = await generateFileBuffer(htmlInvoice, options);
    const { key, path } = await uploadFile(thermalInvoicePdfBuffer, uniqueKey, "pdf");
    sails.log(`${logIdentifier} key: ${key} path: ${path}`);
    invoiceData.thermalPdf = key;
    invoiceData.thermalPdfUrl = path;
    return invoiceData;
  } catch (err) {
    throw err;
  }
};

const checkCountryCode = country => {
  switch(country) {
    case SAR:
      return "KSA";
    case AED:
      return "UAE";
    default:
      return null;
  }
};
const createInvoice = async (orderId, userId = 0, isUserValidate = true) => {
  try {
    const logIdentifier = `API version: ${v1}, Context: EInvoiceService.createInvoice(),`;
    sails.log(`${logIdentifier}`);
    const { customerId, locationId } = await findOrderById(orderId);
    const location = await locationExtractionService.findOne({ id: locationId });
    const { currency } = await getBusinessUnitById(location?.business_unit_id);
    if (currency !== SAR && currency !== AED) {
      sails.log(`${logIdentifier} Cannot create invoice for non KSA orders`);
      return;
    }
    if (userId !== 0 && isUserValidate) { // check if user id is provided for validation
      validateUser(userId, customerId); // check if the order belongs to the logged-in user
    }

    const invoices = await findManyByOrderId(orderId);
    // find any previously generated Credit note invoice
    const cnInvoices = await CreditNoteInvoiceDao.findManyByInvoiceIds(_.map(invoices, "id"));

    const pdfUrls = invoices && invoices.map((invoice, index) => ({
      id: index,
      name: invoice.invoiceNumber,
      title: invoice.title,
      path: getS3Url(invoice.pdfPath),
    }));

    // Return previously generated E-invoice's URL, if exists and Credit-Note is not generated
    if (pdfUrls.length !== 0 && cnInvoices.length === 0) {
      return pdfUrls;
    }
    if (cnInvoices.length !== 0) {
      pdfUrls.push(..._.map(cnInvoices, (cnInvoice, index) => ({
        id: (pdfUrls).length + index,
        name: cnInvoice.invoiceNumber,
        title: cnInvoice.title,
        path: getS3Url(cnInvoice.pdfPath),
      })));
    }
    // Return previously generated 2 E-invoices and Credit-Note's URL
    if (cnInvoices.length < invoices.length) {
      return pdfUrls;
    }

    const status = await findLatestBatchStatusByOrderId(orderId); // Find the latest batch of the order by order Id
    sails.log(`${logIdentifier} : Latest Batch Status : ${status}`);
    validateBatchClosed(status); // validating the batch

    const user = camelcaseKeys(await customerExtractionService.findOne({ id: customerId }));
    const countryCode = checkCountryCode(currency);
    const invoiceData = await getInvoiceData(orderId, user, false, countryCode);
    const uniqueKey = getUniqueKey();
    const S3Key = `files/${uniqueKey}.pdf`;
    const S3URL = getS3Url(S3Key);

    invoiceData.qr = qr.imageSync(S3URL, EINVOICE_QR_CONFIG);
    const uploadedInvoice = await generateAndUploadEinvoiceToS3(invoiceData, uniqueKey, user?.customerType, false);
    const firstInvoice = {
      id: (pdfUrls).length,
      name: uploadedInvoice.invoiceNumber,
      title: "Tax Invoice",
      path: uploadedInvoice.eInvoicePdfUrl,
    };

    await saveInvoice(uploadedInvoice, user);
    return { path: [...pdfUrls, firstInvoice], invoiceData };
  } catch (err) {
    throw err;
  }
};

const generateReferencesInvoicesAndCN = (invoices, cnInvoices, statusId) => {
  const refArr = [];
  if(invoices.length > 0) {
    refArr.push(..._.map(invoices, (invoice, index) => ({
      id: index,
      issueDate: moment.utc(invoice.invoiceIssueDate).tz(ZONE).format(DATE_TIME_FORMAT),
      orderStatus: Constants.HyprOrderStates.getOrderStatusFromId(statusId),
      invoiceNumber: invoice.invoiceNumber,
    })));
  }

  if(cnInvoices.length > 0) {
    refArr.push(..._.map(cnInvoices, (cnInvoice, index) => ({
      id: index,
      issueDate: moment.utc(cnInvoice.invoiceIssueDate).tz(ZONE).format(DATE_TIME_FORMAT),
      orderStatus: Constants.HyprOrderStates.getOrderStatusFromId(statusId),
      invoiceNumber: cnInvoice.invoiceNumber,
    })));
  }
  return _.sortBy(refArr, item => new moment(item.issueDate));
};

const createThermalInvoiceByOrderId = async (
  orderId,
  paperSize = THERMAL_INVOICE_PAPERSIZE,
  publishToSNS = true,
) => {
  const logIdentifier = `API version: ${v1}, Context: EInvoiceService.createThermalInvoiceByOrderId(), OrderId: ${orderId}`;
  try {
    sails.log(`${logIdentifier}`);
    const { customerId, statusId, locationId } = await findOrderById(orderId);
    const location = await locationExtractionService.findOne({ id: locationId });
    const { currency } = await getBusinessUnitById(location?.business_unit_id);
    if (currency !== SAR && currency !== AED) {
      sails.log(`${logIdentifier} Cannot create invoice for non KSA orders`);
      return;
    }

    if (
      !(
        statusId === Constants.HyprOrderStates.DELIVERED ||
        statusId === Constants.HyprOrderStates.PARTIAL_DELIVERED
      )
    ) {
      sails.log.error(`${logIdentifier} INVALID_THERMAL_INVOICE_ORDER_STATUS, statusId ${statusId}`);
      // eslint-disable-next-line no-throw-literal
      throw { data: INVALID_THERMAL_INVOICE_ORDER_STATUS() };
    }
    // Return previously generated Thermal invoice's URL, if exists
    const invoices = await findManyByOrderId(orderId);
    const pdfUrls = invoices && invoices.map((invoice, index) => ({
      id: index,
      name: invoice.invoiceNumber,
      title: invoice.title,
      path: getS3Url(invoice.thermalPdf),
    }));
    // find any previously generated Credit note invoice
    const cnInvoices = await CreditNoteInvoiceDao.findManyByInvoiceIds(_.map(invoices, "id"));

    // Return previously generated E-invoice's URL, if exists and Credit-Note is not generated
    if (pdfUrls.length !== 0 && cnInvoices.length === 0) {
      return pdfUrls;
    }
    if (cnInvoices.length !== 0) {
      pdfUrls.push(..._.map(cnInvoices, (cnInvoice, index) => ({
        id: (pdfUrls).length + index,
        name: cnInvoice.invoiceNumber,
        title: cnInvoice.title,
        path: getS3Url(cnInvoice.thermalPdf),
      })));
    }
    // Return previously generated 2 E-invoices and Credit-Note's URL
    if (cnInvoices.length < invoices.length) {
      return pdfUrls;
    }
    const user = camelcaseKeys(await customerExtractionService.findOne({ id: customerId }));

    const countryCode = checkCountryCode(currency);
    const invoiceData = await getInvoiceData(orderId, user, false, countryCode);
    const uniqueKey = getUniqueKey();
    const S3Key = `files/${uniqueKey}.pdf`;
    const S3URL = getS3Url(S3Key);
    invoiceData.referencesArr = generateReferencesInvoicesAndCN(invoices, cnInvoices, statusId);

    // Generate and upload E-invoice (Pdf + Xml)
    invoiceData.qr = qr.imageSync(S3URL, EINVOICE_QR_CONFIG);
    let invoice = await generateAndUploadEinvoiceToS3(invoiceData, uniqueKey, user?.customerType, publishToSNS);

    // Generate and upload Thermal-invoice Pdf
    invoiceData.qr = qr.imageSync(S3URL, THERMAL_INVOICE_QR_CONFIG);
    invoice = await generateAndUploadThermalInvoiceToS3(invoice, user?.customerType, paperSize, publishToSNS);

    const firstInvoice = {
      id: (pdfUrls).length,
      name: invoice.invoiceNumber,
      title: "Tax Invoice",
      path: invoice.thermalPdfUrl,
    };
    await saveInvoice(invoice, user);
    await markInvoiceDownloadedForOrder(orderId);
    return [...pdfUrls, firstInvoice];
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    throw err;
  }
};

const createCreditNoteInvoice = async (invoiceId, invoice) => {
  try {
    const logIdentifier = `API version: ${v1}, Context: EInvoiceService.createCreditNoteInvoice(),`;
    sails.log(`${logIdentifier}`);

    // find previously generated Credit note invoices
    const cnInvoices = await CreditNoteInvoiceDao.findManyByInvoiceIds([invoiceId]);
    if (!_.isEmpty(cnInvoices)) {
      return _.map(cnInvoices, cnInvoice => getS3Url(cnInvoice.pdfPath));
    }

    if (!invoice) {
      // eslint-disable-next-line no-param-reassign
      invoice = await findByCheckedId(invoiceId);
      if (_.isEmpty(invoice)) {
        throw { data: INVOICE_NOT_FOUND };
      }
    }

    const { customerId, statusId, deliveryTime, locationId } = await findOrderById(invoice.orderId);
    const location = await locationExtractionService.findOne({ id: locationId });
    const { currency } = await getBusinessUnitById(location?.business_unit_id);
    if (currency !== SAR && currency !== AED) {
      sails.log(`${logIdentifier} Cannot create credit note for non KSA and UAE orders`);
      return;
    }
    const countryCode = checkCountryCode(currency);
    const user = camelcaseKeys(await customerExtractionService.findOne({ id: customerId }));
    let invoiceData = {};
    if (!_.isEmpty(invoice.json)) {
      invoiceData = camelcaseKeys(invoice.json, { deep: true });
      invoiceData.totalAmount = invoiceData.totalAmountDue;
      invoiceData = await getInvoiceDates(invoiceData, deliveryTime, true, countryCode);
    } else {
      invoiceData = await getInvoiceData(invoice.orderId, user, true, countryCode);
      try {
        const xmlData = await parseDataFromXML(invoice.xmlPath);
        invoiceData.buyer = { ...invoiceData.buyer, ...xmlData };
      } catch (error) {
        sails.log(`${logIdentifier}, ERR: ${error}`);
      }
    }

    const invoices = await findManyByOrderId(invoice.orderId);
    const cnInvoicesAll = await CreditNoteInvoiceDao.findManyByInvoiceIds(_.map(invoices, "id"));
    invoiceData.isCreditNoteInvoice = true;
    invoiceData.invoiceId = invoice.id;
    invoiceData.version = invoice.version;
    invoiceData.referencesArr = generateReferencesInvoicesAndCN(invoices, cnInvoicesAll, statusId);

    const uniqueKey = getUniqueKey();
    const S3Key = `files/${uniqueKey}.pdf`;
    const S3URL = getS3Url(S3Key);

    invoiceData.qr = qr.imageSync(S3URL, EINVOICE_QR_CONFIG);
    const publishToSNS = true;
    let uploadedInvoice = await generateAndUploadEinvoiceToS3(
      invoiceData,
      uniqueKey,
      user?.customerType,
      publishToSNS,
      invoiceData.version,
      true,
    );

    // Generate and upload Thermal-invoice Pdf
    uploadedInvoice.qr = qr.imageSync(S3URL, THERMAL_INVOICE_QR_CONFIG);
    uploadedInvoice = await generateAndUploadThermalInvoiceToS3(uploadedInvoice, user?.customerType, THERMAL_INVOICE_PAPERSIZE, publishToSNS, invoiceData.version, true);

    await saveInvoice(uploadedInvoice, user, true);
    return uploadedInvoice.eInvoicePdfUrl;
  } catch (err) {
    throw err;
  }
};

/**
 * The function creates invoices for all orders in the batch
 * @param {Number} batchId
 * @returns {Object}
 */
const createInvoicesForBatchOrders = async batchId => {
  const logIdentifier = `API version: ${v1}, Context: BatchService.createInvoicesForBatchOrders(),`;
  let loopCounter = 0;
  let batchOrders;
  try {
    batchOrders = await Promise.resolve(findBatchOrders({ batchId, deletedAt: null }));
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
  }
  for (let index = 0; index < batchOrders.length; index++) {
    try {
      await createThermalInvoiceByOrderId(batchOrders[index].orderId);
      loopCounter++;
    } catch (error) {
      sails.log.error(
        `${logIdentifier} An error occured while creating invoice for orderId: ${batchOrders[index].orderId}, Error -> ${JSON.stringify(error.stack || error)}`,
      );
    }
  }
  sails.log.warn(
    `${logIdentifier} For batchId: ${batchId}, invoice creation failed for ${batchOrders.length - loopCounter} / ${batchOrders.length} batch orders`,
  );
};

/**
 * Creates creditNotes for all ordres for a customer set.
 * @param {Number} customerId
 * @returns {Object}
 */
const bulkCreditNotesAndInvoices = async (ids, dataType) => {
  try {
    const invoices = [];
    const logIdentifier = `API version: ${v1}, Context: BatchService.bulkCreditNotesAndInvoices(),`;
    for (const id of ids) {
      const allInvocies = await findByCriteria({ [dataType]: id });
      invoices.push(...allInvocies);
    }
    for (let index = 0; index < invoices.length; index++) {
      const orderId = invoices[index].orderId;
      try {
        await createCreditNoteInvoice(invoices[index].id, invoices[index]);
        await createThermalInvoiceByOrderId(orderId);
      } catch (error) {
        sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
      }
    }
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
  }
};

const findLatestInvoice = async orderId => {
  const invoice = await findLatestInvoiceByOrderId(orderId);
  if (_.isEmpty(invoice)) {
    throw { data: INVOICE_NOT_FOUND };
  }
  return invoice;
};


const createOrPublishInvoice = async (publishToSNS, invoiceType, invoiceData, isCreditNote) => {
  const logIdentifier = `API version: ${v1}, Context: EInvoiceService.createOrPublishInvoice(),`;
  try {
    if (publishToSNS) {
      await publishMessage(keys.invoice_topic_arn, JSON.stringify(createInvoiceObj(invoiceType, invoiceData, isCreditNote)));
    } else {
      await getOrCreateInvoice(createInvoiceObj(invoiceType, invoiceData, isCreditNote));
    }
  } catch (err) {
    sails.log.error(`${logIdentifier} Error: ${err}`);
  }
};

module.exports = {
  createInvoice,
  createThermalInvoiceByOrderId,
  generateNewInvoiceNumber,
  createCreditNoteInvoice,
  createInvoicesForBatchOrders,
  bulkCreditNotesAndInvoices,
  findLatestInvoice,
  markInvoiceDownloadedForOrder,
};
