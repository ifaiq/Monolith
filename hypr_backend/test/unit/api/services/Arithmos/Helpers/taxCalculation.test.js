const { expect, test } = require("../../../../../common");
const taxCalculation = require("../../../../../../api/modules/v1/Arithmos/Helpers/TaxCalulation");


describe("TaxCalculation.getTax()", () => {
  it("should return valid tax amount",
    test(async () => {
      const inputOutputDict = [
        {
          taxPercentage: 10,
          price: 100,
          expectedTaxAmount: 10,
        },
        {
          taxPercentage: 20.8,
          price: 50.9,
          expectedTaxAmount: 10.5872,
        },
        {
          taxPercentage: 0,
          price: 100,
          expectedTaxAmount: 0,
        },
        {
          taxPercentage: 10,
          price: 0,
          expectedTaxAmount: 0,
        },
        {
          taxPercentage: 0,
          price: 0,
          expectedTaxAmount: 0,
        },
      ];

      for (const testCase of inputOutputDict) {
        const result = taxCalculation.getTax(testCase.taxPercentage, testCase.price);
        expect(result).to.be.equal(testCase.expectedTaxAmount);
      }
    }),
  );
});

describe("taxCalculation.getTaxPercentage()", () => {
  it("should return valid tax exclusive price",
    test(async () => {
      const inputOutputDict = [
        {
          tax: 10,
          price: 100,
          expectedTaxPercentage: 10,
        },
        {
          tax: 10,
          price: 110,
          expectedTaxPercentage: 9.09,
        },
        {
          tax: 0,
          price: 100,
          expectedTaxPercentage: 0,
        },
        {
          tax: -10,
          price: 100,
          expectedTaxPercentage: -10,
        },
        {
          tax: 15.63,
          price: 73.94,
          expectedTaxPercentage: 21.14,
        },
        {
          tax: 2.37,
          price: 2582.74,
          expectedTaxPercentage: 0.09,
        },
      ];
      for (const testCase of inputOutputDict) {
        const result = taxCalculation.getTaxPercentage(testCase.tax, testCase.price);
        expect(parseFloat(result.toFixed(2))).to.be.equal(testCase.expectedTaxPercentage);
      }
    }),
  );
});
