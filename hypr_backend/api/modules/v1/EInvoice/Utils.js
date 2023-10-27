const https = require("https");
const { parseString } = require("xml2js");
const concat = require("concat-stream");
const { getS3Url } = require("../Utils/S3Helper");
const {
  MULTI_DOWNLOAD_MIN_VERSION_SUPPORT_ANDROID,
  MULTI_DOWNLOAD_MIN_VERSION_SUPPORT_iOS,
  MULTI_DOWNLOAD_MIN_VERSION_LOGISTICS,
  ARRAY_OF_OBJECTS_RESPONSE_SUPPORT_MIN_VERSION_ANDROID,
  ARRAY_OF_OBJECTS_RESPONSE_SUPPORT_MIN_VERSION_iOS,
} = require("./Constants");
const {
  TAX_CATEGORIES: { TAX_ON_PRICE },
} = require("../../../services/Constants.js");

/**
 * This function takes the last invoice number, and return incremented new invoice numbre e.g. KSA432RET-001.
 *
 * @param {String} lastInvoiceNumber
 * @returns {String} Invoice Number
 */
const generateInvoiceNumber = (lastInvoiceNumber, isCreditNoteInvoice, defaultCountry) => {
  const invoicePrefix = lastInvoiceNumber
    ? lastInvoiceNumber.split("-")[0]?.substr(0, 3)
    : defaultCountry; // e.g. KSA for Saudi and UAE for Dubai
  let invoiceNumber = lastInvoiceNumber
    ? lastInvoiceNumber.split("-")[1]
    : "000"; // number to increment
  const incrementNumber = parseInt(invoiceNumber) + 1;
  const leadingZeros = getLeadingZeros(incrementNumber, invoiceNumber);

  // lets re-add the leading zeros
  invoiceNumber = ("0".repeat(leadingZeros) + incrementNumber).substr(
    -leadingZeros,
  );
  return `${invoicePrefix}${isCreditNoteInvoice ? "CN" : ""}-${invoiceNumber}`.toUpperCase();
};

const getLeadingZeros = (incrementNumber, invoiceNumber) => {
  try {
    return incrementNumber.toString().length > invoiceNumber.length ?
      incrementNumber.toString().length :
      invoiceNumber.length;
  } catch (error) {
    return 3;
  }
};

/**
 * Function takes long text and returns truncated text
 * @param {String} text
 * @returns {Number} truncate
 */
const truncateText = (text, limit = 20) => {
  let truncatedText = text;
  if (text && text.length > limit) {
    truncatedText = text.slice(0, limit) + "...";
  }
  return truncatedText;
};

/**
 * Function takes long text and returns truncated text
 * @param {String} url
 * @returns {Object} customer object
 */
const parseDataFromXML = xmlPath => (
  new Promise((resolve, reject) => {
    https.get(`${getS3Url(xmlPath)}`, resp => {
      resp.pipe(concat(buffer => {
        const str = buffer.toString();
        // eslint-disable-next-line handle-callback-err
        parseString(str, (err, result) => {
          try {
            const customerData = result.Invoice["cac:AccountingCustomerParty"][0]["cac:Party"][0];
            resolve({
              vat: customerData["cac:PartyTaxScheme"][0]["cbc:CompanyID"]?.trim(),
              businessName: customerData["cac:PartyLegalEntity"][0]["cbc:RegistrationName"]?.trim(),
            });
          } catch (error) {
            reject(error);
          }
        });
      }));
    });
  })
);

const checkMultiDownloadSupport = (userAppVerison = "", os = "") => {
  if (os.toLowerCase() === "android") {
    return _isUserAppVersionSupported(userAppVerison, MULTI_DOWNLOAD_MIN_VERSION_SUPPORT_ANDROID);
  } else if (os.toLowerCase() === "ios") {
    return _isUserAppVersionSupported(userAppVerison, MULTI_DOWNLOAD_MIN_VERSION_SUPPORT_iOS);
  }
  return false;
};

const checkArrayOfObjectsResponseSupport = (userAppVerison = "", os = "") => {
  if (os.toLowerCase() === "android") {
    return _isUserAppVersionSupported(userAppVerison, ARRAY_OF_OBJECTS_RESPONSE_SUPPORT_MIN_VERSION_ANDROID);
  } else if (os.toLowerCase() === "ios") {
    return _isUserAppVersionSupported(userAppVerison, ARRAY_OF_OBJECTS_RESPONSE_SUPPORT_MIN_VERSION_iOS);
  }
  return false;
};

// TODO REFACTOR INTO A SINGLE FUNC
const checkMultiDownloadSupportLogistics = (userAppVerison = "") =>
  _isUserAppVersionSupported(userAppVerison, MULTI_DOWNLOAD_MIN_VERSION_LOGISTICS);

/**
 * Compares user app version to minimum supported app version
 * @param {*} userAppVersion
 * @param {*} minimumSupportedVersion
 * @returns {Boolean} true/false
 */
const _isUserAppVersionSupported = (userAppVersion, minimumSupportedVersion) => {
  const userAppVersionParts = userAppVersion.split(".").map(Number);
  const minimumSupportedVersionParts = minimumSupportedVersion.split(".").map(Number);

  while (userAppVersionParts.length < minimumSupportedVersionParts.length) userAppVersionParts.push(0);
  while (minimumSupportedVersionParts.length < userAppVersionParts.length) minimumSupportedVersionParts.push(0);

  for (let i = 0; i < userAppVersionParts.length; ++i) {
    if (
      userAppVersionParts[i] === minimumSupportedVersionParts[i]
    ) {
      continue;
    } else if (userAppVersionParts[i] > minimumSupportedVersionParts[i]) {
      return true;
    } else {
      return false;
    }
  }

  if (userAppVersionParts.length !== minimumSupportedVersionParts.length) {
    return false;
  }

  return true;
};

const lineItemConstructorForFees = (fee, name, taxRate) => {
  const baseFee = Number(((fee) / (1 + (taxRate / 100))).toFixed(2));
  const tax = Number((fee - baseFee).toFixed(2));
  return {
    name: name,
    unitPrice: baseFee,
    price: baseFee,
    quantity: 1,
    taxRate: taxRate,
    basePrice: fee,
    taxPercentage: taxRate,
    taxableAmount: baseFee,
    discount: 0,
    taxCategory: TAX_ON_PRICE,
    taxAmount: tax,
    totalPrice: fee,
    tax: tax,
    totalPriceWithTax: fee,
  };
};

module.exports = {
  truncateText,
  generateInvoiceNumber,
  parseDataFromXML,
  checkMultiDownloadSupport,
  checkArrayOfObjectsResponseSupport,
  checkMultiDownloadSupportLogistics,
  lineItemConstructorForFees,
};
