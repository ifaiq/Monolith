/* eslint-disable max-len */
const { chai, expect, test } = require("../../../../common");
const deepEqualInAnyOrder = require("deep-equal-in-any-order");
chai.use(deepEqualInAnyOrder);

const pricingEngineService = require("../../../../../api/pricing_engine_service/pricingEngineService");
const { productList } = require('./constants');


describe("PricingEngineService.getUpdatedProductList()", (done) => {
  it(
    "should return products in same order as sent in payload",
    test(() => {
      pricingEngineService
      .getUpdatedProductList({ locationId: 13, zoneId: '1,2,3', shopTypeId: 1, products: productList})
      .then((actualResult) => {
        const maintainsOrder = actualResult.every((product, index) => product.id === productList[index].id)
        expect(maintainsOrder).to.be.true
        done();
      })

    }),
  );
});
