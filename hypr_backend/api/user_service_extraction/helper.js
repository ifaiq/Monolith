const makeCriteria = (params) => {
  const criteria = {}
  if (params.id) {
    if (typeof params.id === typeof []) { // Since type of [] is object in JS
      criteria.id = { 'in': params.id };
    } else {
      criteria.id = params.id;
    }
  }
  if (params.name) {
    criteria.name = { contains: params.name };
  }
  if (params.select && params.id) {
    delete criteria.id;
    criteria.where = { id: params.id };
    criteria.select = params.select;
    if (params.phone) {
      criteria.where.phone = { in: params.phone }
    }
  }
  if (params.username) {
    criteria.username = params.username;
  }
  return criteria
}

const makeParamsForUserService = (params) => {
  Object.keys(params).forEach(key => {
    if (typeof params[key] === typeof []) {
      params[key] = params[key].join(',');
    }
  });
  return params;
}

module.exports = {
  makeCriteria,
  makeParamsForUserService,
};
