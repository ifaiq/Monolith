const makeParamsForNotificationService = params => {
  Object.keys(params).forEach(key => {
    if (typeof params[key] === typeof []) {
      params[key] = params[key].join(",");
    }
  });
  return params;
};

module.exports = {
  makeParamsForNotificationService,
};
