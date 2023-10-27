/* eslint-disable node/no-unpublished-require */
const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const sinonTest = require("sinon-test");

const test = sinonTest(sinon);

module.exports = {
  chai,
  expect,
  sinon,
  sinonChai,
  test,
};
