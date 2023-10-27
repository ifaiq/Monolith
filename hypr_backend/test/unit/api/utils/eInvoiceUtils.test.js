/* eslint-disable no-console */
const { chai, expect, sinonChai, test } = require("../../../common");
const randomstring = require("randomstring");
const {
  generateInvoiceNumber,
} = require("../../../../api/modules/v1/EInvoice/Utils");

chai.use(sinonChai);

describe("eInvoiceUtils.generateInvoiceNumber", () => {
  it(
    "should return the correct invoice when generateInvoiceNumber is called",
    test(() => {
      const inputOutputDict = [
        {
          inputInvoiceNumber: `USA${randomstring.generate(6)}-001`,
          inputCountry: "KSA",
          expectedInvoiceIncrementedNumber: "002",
          expectedInvoicePrefixCountry: "USA",
        },
        {
          inputInvoiceNumber: `ksa${randomstring.generate(6)}-999`,
          inputCountry: "KSA",
          expectedInvoiceIncrementedNumber: "1000",
          expectedInvoicePrefixCountry: "KSA",
        },
        {
          inputInvoiceNumber: `RIY${randomstring.generate(6)}-1000`,
          inputCountry: "MPP",
          expectedInvoiceIncrementedNumber: "1001",
          expectedInvoicePrefixCountry: "RIY",
        },
      ];

      for (const testCase of inputOutputDict) {
        const output = generateInvoiceNumber(
          testCase.inputInvoiceNumber,
          testCase.inputCountry,
        );

        const outputCountry = output.substring(0, 3);
        const outputInvoiceNumber = output.split("-")[1];

        expect(outputCountry).to.equal(testCase.expectedInvoicePrefixCountry);
        expect(outputInvoiceNumber).to.equal(
          testCase.expectedInvoiceIncrementedNumber,
        );
      }
    }),
  );

  it(
    "should return an alpha-numeric 13+ characters invoice number",
    test(() => {
      const inputInvoiceNumber = `PAK-001`;
      const output = generateInvoiceNumber(inputInvoiceNumber);

      expect(output).to.match(/^[A-Z]{3}-[0-9]{3,}$/);
    }),
  );

});
