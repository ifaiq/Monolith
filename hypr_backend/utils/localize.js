class LocalizationObject {
  constructor(parameters) {
    this.parameters = parameters;
  }
}

const localize = (obj, res) => {
  if (!obj) {
    return obj;
  }

  try {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] !== "object") {
        return;
      }

      if (obj[key] instanceof LocalizationObject) {
        obj[key] = res.locals.__(...obj[key].parameters);
      } else if (obj[key] instanceof Array) {
        obj[key] = obj[key].map(item => localize(item, res));
      } else {
        obj[key] = localize(obj[key], res);
      }
    });
  } catch (error) {
    // Ignore localization if error is thrown
    sails.log.error("Localization Failed: ", error);
    return obj;
  }

  return obj;
};

const exportedModule = module.exports = localize;
exportedModule.LocalizationObject = LocalizationObject;
