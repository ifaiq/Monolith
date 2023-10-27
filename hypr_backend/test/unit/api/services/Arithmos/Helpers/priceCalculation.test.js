const { expect, test } = require("../../../../../common");
const priceCalculation = require("../../../../../../api/modules/v1/Arithmos/Helpers/PriceCalculation");


describe("PriceCalculation.calculateMRPTaxExclusivePrice()", () => {
  it("should return valid tax exclusive price",
    test(async () => {
      const inputOutputDict = [
        {
          price: 110,
          mrpTax: 10,
          taxExclusivePrice: 100,
        },
        {
          price: 50.9,
          mrpTax: 20.8,
          taxExclusivePrice: 30.1,
        },
        {
          price: 100,
          mrpTax: 0,
          taxExclusivePrice: 100,
        },
        {
          price: 0,
          mrpTax: 10,
          taxExclusivePrice: -10,
        },
        {
          price: 0,
          mrpTax: 0,
          taxExclusivePrice: 0,
        },
      ];

      for (const testCase of inputOutputDict) {
        const result = priceCalculation.calculateMRPTaxExclusivePrice(testCase.price, testCase.mrpTax);
        expect(result).to.be.equal(testCase.taxExclusivePrice);
      }
    }),
  );
});

describe("PriceCalculation.subtractTaxFromConsumerPrice()", () => {
  it("should return valid tax exclusive price",
    test(async () => {
      const inputOutputDict = [
        {
          price: 110,
          tax: 10,
          taxExclusivePrice: 100,
        },
        {
          price: 50.9,
          tax: 20.8,
          taxExclusivePrice: 30.1,
        },
        {
          price: 100,
          tax: 0,
          taxExclusivePrice: 100,
        },
        {
          price: 0,
          tax: 10,
          taxExclusivePrice: -10,
        },
        {
          price: 0,
          tax: 0,
          taxExclusivePrice: 0,
        },
      ];

      for (const testCase of inputOutputDict) {
        const result = priceCalculation.subtractTaxFromConsumerPrice(testCase.price, testCase.tax);
        expect(result).to.be.equal(testCase.taxExclusivePrice);
      }
    }),
  );
});

describe("PriceCalculation.calculateExclusiveTaxPrice()", () => {
  it("should return valid tax exclusive price",
    test(async () => {
      const inputOutputDict = [
        {
          price: 110,
          taxPercent: 10,
          taxExclusivePrice: 100,
        },
        {
          price: 100,
          taxPercent: 10,
          taxExclusivePrice: 90.91,
        },
        {
          price: 0,
          taxPercent: 10,
          taxExclusivePrice: 0,
        },
        {
          price: -110,
          taxPercent: 10,
          taxExclusivePrice: -100,
        },
        {
          price: 83.92,
          taxPercent: 13.26,
          taxExclusivePrice: 74.1,
        },
        {
          price: 1836.93,
          taxPercent: 2.93,
          taxExclusivePrice: 1784.64,
        },
      ];
      for (const testCase of inputOutputDict) {
        const result = priceCalculation.calculateExclusiveTaxPrice(testCase.price, testCase.taxPercent);
        expect(parseFloat(result.toFixed(2))).to.be.equal(testCase.taxExclusivePrice);
      }
    }),
  );
});

describe("PriceCalculation.calculateBasePriceFromMRP()", () => {
  it("should return valid basePriceFromMRP",
    test(async () => {
      const inputOutputDict = [
        {
          mrp: 110,
          taxPercent: 10,
          basePriceFromMRP: 100,
        },
        {
          mrp: 100,
          taxPercent: 10,
          basePriceFromMRP: 90.91,
        },
        {
          mrp: 0,
          taxPercent: 10,
          basePriceFromMRP: 0,
        },
        {
          mrp: -110,
          taxPercent: 10,
          basePriceFromMRP: -100,
        },
        {
          mrp: 83.92,
          taxPercent: 13.26,
          basePriceFromMRP: 74.1,
        },
        {
          mrp: 1836.93,
          taxPercent: 2.93,
          basePriceFromMRP: 1784.64,
        },
      ];
      for (const testCase of inputOutputDict) {
        const result = priceCalculation.calculateBasePriceFromMRP(testCase.mrp, testCase.taxPercent);
        expect(parseFloat(result.toFixed(2))).to.be.equal(testCase.basePriceFromMRP);
      }
    }),
  );
});
