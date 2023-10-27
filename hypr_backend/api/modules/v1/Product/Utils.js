const AWSService = require("../../../services/AWSService");
const AWS = AWSService.getAWSConfig();
const s3 = new AWS.S3();
const { getLanguage } = require("../../../../utils/languageAccessor");
const { MultiLingualAttributes } = require("../../../constants/enums");

/**
 * Function takes the duplicate products and return the unique products
 * @param {Product[]} products
 * @returns {Product[]}} products
 */
const mergeDuplicateProducts = products =>
  products.reduce((uniqueProducts, product) => {
    const uniqueProduct = uniqueProducts.find(({ id }) => id === product.id);
    if (!uniqueProduct) {
      uniqueProducts.push(product);
    } else {
      const index = uniqueProducts.findIndex(({ id }) => id === uniqueProduct.id);
      uniqueProducts[index].quantity = uniqueProducts[index].quantity + product.quantity;
    }
    return uniqueProducts;
  }, []);

const formatDescription = descriptionAsString => {
  if (descriptionAsString === null) {
    return null;
  }
  let formattedDescription = [];
  const initialPipeRemoved = descriptionAsString.replace(/^\|+/, "");
  formattedDescription = initialPipeRemoved.split("|");
  formattedDescription = formattedDescription.map(element => element.trim());
  if (formattedDescription.every(descriptionBulletString => descriptionBulletString === "")) {
    return null;
  }
  return formattedDescription;
};

const createReadStream = fileName => {
  const s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: fileName };
  return s3.getObject(s3Options).createReadStream();
};

/**
 * Function takes name and multilingual and returns localized product name
 * @param {Product[]} products
 * @returns {Product[]}} products
 */
const getLocalizedName = (locName, multilingual) => {
  let name = locName;
  if (multilingual) {
    const localizedName = multilingual.find(
      obj =>
        obj.language === getLanguage() &&
        obj.attributeName === MultiLingualAttributes.NAME,
    );
    name = localizedName ? localizedName.value : name;
  }
  if (name.length > 35) {
    // FE requirement. Need to limit product name to 30 char for snack bar.
    name = name.slice(0, 15) + "..." + name.slice(-15);
  }
  return name;
};

const sortProperties = obj => {
  // convert object into array
  const sortable = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sortable.push([key, obj[key]]);
    }
  } // each item is an array in format [key, value]

  // sort items by value
  sortable.sort((a, b) =>
    b[1] - a[1], // compare numbers
  );
  const sortedKeys = [];
  for (const item of sortable) {
    sortedKeys.push(parseInt(item[0]));
  }
  return sortedKeys;
};

const sortProducts = (products, productIds) => {
  const sortedProducts = products.sort((a, b) => productIds.indexOf(a.id) - productIds.indexOf(b.id));
  return sortedProducts;
};
const countUniqueProduct = orderProductIds => {
  const totalCount = {};
  for (const item of orderProductIds) {
    if (!totalCount[item.product_id]) {
      totalCount[item.product_id] = 1;
    } else {
      totalCount[item.product_id] = totalCount[item.product_id] + 1;
    }
  }
  return totalCount;
};

const getFormattedLanguage = lang => {
  const language = ["EN", "AR", "UR", "RU"].includes(lang.toUpperCase()) ? lang.toUpperCase() : "EN";
  return language;
};

module.exports = {
  mergeDuplicateProducts,
  formatDescription,
  createReadStream,
  getLocalizedName,
  sortProperties,
  sortProducts,
  countUniqueProduct,
  getFormattedLanguage,
};
