const CATEGORY_TYPE = {
  CATEGORY: 0,
  BRAND: 1,
};

const FUNNEL_PARENT_TYPE = {
  LOCATION: 0,
  FUNNEL: 1,
};

const FUNNEL_FLOW = {
  LOCATION_CATEGORIES: 0,
  LOCATION_BRANDS: 1,
  CATEGORY_SUBCATEGORIES: 2,
  BRAND_SUBBRANDS: 3,
  UNDETERMINED: 4,
};

module.exports = {
  CATEGORY_TYPE,
  FUNNEL_PARENT_TYPE,
  FUNNEL_FLOW,
};