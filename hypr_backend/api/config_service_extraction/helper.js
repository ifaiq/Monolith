const makeParamsForUserService = params => {
  Object.keys(params).forEach(key => {
    if (typeof params[key] === typeof []) {
      params[key] = [...new Set(params[key])];
      params[key] = params[key].join(",");
    }
  });
  return params;
};


module.exports = {
  makeParamsForUserService,
};
