const productDao = require("../Product/ProductDao");
const customerReportDao = require("./CustomerSkuReportDao");
const { readCSV, convertCsvBufferToJson, getS3Url } = require("../../../../utils/csv-helpers");
const customerExtractionService = require("../../../user_service_extraction/customerService");

const {
  constants: {
    request: {
      VERSIONING: { v1 },
    },
  },
} = require("../../../constants/http");
const { getPagination } = require("../../../../utils/services");


const createReportUserSku = async ({ filename, fileUrl, updatedBy, s3 }) => {
  const logIdentifier = `API version: ${v1}, context:CustomerSkuReportService.createReportUserSku()`;
  let data;
  let invalidSkus = [];
  let invalidPhoneNumbers = [];
  let mappedReportingData = [];
  try {
    const _buff = await readCSV(filename, s3);
    data = convertCsvBufferToJson(_buff);
    sails.log.info(`${logIdentifier}, Convert CSV to JSON object: ${JSON.stringify(data)}`);
  } catch (e) {
    sails.log.error(`${logIdentifier}, Error occured while processing CSV: ${e.message}`);
    throw new Error(e.message);
  }
  if (data.length) {
    if(!data[0].consumer_phone || !data[0].sku) {
      throw new Error("Invalid template, headers must be consumer_phone and sku respectively!");
    }
    const uniqueConsumerPhone = [...new Set(data.map(item => item.consumer_phone))];
    const uniqueSkus = [...new Set(data.map(item => item.sku))];
    let products;
    let customers;

    try {
      products = await productDao.findManyProductIdsBySkus(uniqueSkus);
      invalidSkus = findInvalidSkus(uniqueSkus, products);
    } catch (e) {
      throw new Error(e.message);
    }

    try {
      customers = await customerExtractionService.findAll({
        allData: true,
      }, { phone: uniqueConsumerPhone.join(",") });
      invalidPhoneNumbers = findInvalidPhoneNumbers(uniqueConsumerPhone, customers);
    } catch (e) {
      throw new Error(e.message);
    }
    mappedReportingData = mapCustomerSkuReporting(data, products, customers, updatedBy, filename, fileUrl);

    try {
      await customerReportDao.upsertMany(mappedReportingData);
    } catch (e) {
      throw new Error(e.message);
    }
  }
  return {
    totalProcessedRecords: mappedReportingData.length,
    message: "Records have been processed successfully!",
    totalFailedRecords: data.length - mappedReportingData.length,
    errors: {
      invalidSkus: {
        total: invalidSkus.length,
        data: invalidSkus,
      },
      invalidPhoneNumbers: {
        total: invalidPhoneNumbers.length,
        data: invalidPhoneNumbers,
      },
    },
  };
};

const mapCustomerSkuReporting = (
  data,
  products,
  customers,
  updatedBy,
  filename,
  fileUrl,
) => {
  const mappedData = [];
  for (let i = 0; i < data.length; i++) {
    const customerObject = customers.find(customer => customer.phone === data[i].consumer_phone.toString());
    const productObject = products.find(product => product.sku === data[i].sku);
    if (productObject && customerObject) {
      mappedData.push({
        customerId: customerObject.id,
        productId: productObject.id,
        updatedBy,
        fileName: filename,
        fileUrl,
      });
    }
  }
  return mappedData;
};

const getCustomerReportSku = async ({ page, perPage, s3 }) => {
  try {
    const { skip, limit } = getPagination(+page, +perPage);
    const data = await customerReportDao.findAll(skip, limit);
    const mappedData = await mapResponse(data, s3);
    const total = await customerReportDao.getCount();
    return {
      message: "Records have been fetched!",
      page: +page,
      perPage: +perPage,
      total: total?.rows[0]?.total || 0,
      data: mappedData,
    };
  } catch (e) {
    throw new Error(e.message);
  }
};

const mapResponse = async (data, s3) => {
  const mappedData = [];
  for (let i = 0; i < data.length; i++) {
    let fileurl;
    if (data[i] && data[i].fileUrl) {
      fileurl = data[i].fileUrl;
    } else if (data[i] && !data[i].fileUrl && data[i].fileName) {
      fileurl = await getS3Url(data[i].fileName, s3);
    }
    mappedData.push({
      fileName: data[i].fileName,
      fileUrl: fileurl,
      status: fileurl ? "available" : "unavailable",
    });
  }
  return mappedData;
};

const findInvalidPhoneNumbers = (uniqueConsumerPhone, customerData) => {
  if (customerData.length) {
    const invalidPhoneNumbers = uniqueConsumerPhone.map(consumerPhone => {
      const customer = customerData.find(data => data.phone === consumerPhone);
      if(!customer) {
        return consumerPhone;
      }
      return undefined;
    }).filter(data => data);
    return invalidPhoneNumbers;
  }
  return uniqueConsumerPhone;
};

const findInvalidSkus = (uniqueSkus, productData) => {
  if (productData.length) {
    const invalidSkus = uniqueSkus.map(sku => {
      const product = productData.find(data => data.sku === sku);
      if(!product) {
        return sku;
      }
      return undefined;
    }).filter(data => data);
    return invalidSkus;
  }
  return uniqueSkus;
};

module.exports = {
  createReportUserSku,
  getCustomerReportSku,
};
