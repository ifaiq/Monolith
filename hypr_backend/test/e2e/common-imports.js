const supertest = require("supertest");
const chai = require("chai");
const deepEqualInAnyOrder = require("deep-equal-in-any-order");
const expect = chai.expect;

chai.use(require("chai-things"));
chai.use(deepEqualInAnyOrder);

module.exports = {
  request: supertest,
  expect,
};
