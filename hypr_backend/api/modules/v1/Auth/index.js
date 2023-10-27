const { publicRoutes, privateRoutes } = require("./UserRoutes");
const { addPrefixWithRoutes } = require("../../../../utils/routes");
const { constants: { request: { VERSIONING: { v1, prefix } } } } = require("../../../constants/http");
const {
  signUp,
  signIn,
  signOut,
  forgotPassword,
  findCustomerByPhone,
  findCheckedCustomerAddressByCustomerId,
} = require("./UserService");
const customerService = require("./CustomerService");
const companyService = require("./CompanyService");
const { findAuthStoresByUserIdChecked } = require("./AuthStoreService");
const { errors } = require("./Errors");
const { findShopByCustomerId } = require("./CustomerShopDao");
const { findCustomerById } = require("./CustomerDao");
const { findCompanyByCodeChecked } = require("./CompanyDao");

module.exports = {
  userRoutes: addPrefixWithRoutes(`/${prefix}/${v1}/public/user`, publicRoutes),
  userPrivateRoutes: addPrefixWithRoutes(`/${prefix}/${v1}/user`, privateRoutes),
  signUp,
  signIn,
  signOut,
  forgotPassword,
  findCustomerByPhone,
  findCheckedCustomerAddressByCustomerId,
  findAuthStoresByUserIdChecked,
  findCompanyByCodeChecked,
  findShopByCustomerId,
  findCustomerById,
  customerService,
  companyService,
  errors,
};
