/* eslint-disable max-len */
const { chai, expect, test } = require("../../../../common");
const deepEqualInAnyOrder = require("deep-equal-in-any-order");
chai.use(deepEqualInAnyOrder);

const Arithmos = require("../../../../../api/modules/v1/Arithmos/Arithmos");

const volumeBasedPrices = [
  {
    createdAt: "2022-06-19T15:28:32.000Z",
    updatedAt: "2022-06-19T15:28:32.000Z",
    id: 1,
    price: 346,
    quantityFrom: 1,
    quantityTo: 100,
    disabled: false,
    productId: 59865,
    discount: "",
  },
  {
    createdAt: "2022-06-19T15:28:32.000Z",
    updatedAt: "2022-06-19T15:28:32.000Z",
    id: 2,
    price: 300,
    quantityFrom: 101,
    quantityTo: 200,
    disabled: false,
    productId: 59865,
    discount: "",
  },
  {
    createdAt: "2022-06-19T15:28:32.000Z",
    updatedAt: "2022-06-19T15:28:32.000Z",
    id: 3,
    price: 270,
    quantityFrom: 201,
    quantityTo: null,
    disabled: false,
    productId: 59865,
    discount: "",
  },
];

const volumeBasedPricesTaxOnPrice = [
  {
    ...volumeBasedPrices[0],
    tax: "31.45",
    taxExclusivePrice: "314.55",
  },
  {
    ...volumeBasedPrices[1],
    tax: "27.27",
    taxExclusivePrice: "272.73",
  },
  {
    ...volumeBasedPrices[2],
    tax: "24.55",
    taxExclusivePrice: "245.45",
  },
];

const volumeBasedPricesMRP = [
  {
    ...volumeBasedPrices[0],
    tax: "31.45",
    taxExclusivePrice: "314.55",
  },
  {
    ...volumeBasedPrices[1],
    tax: "31.45",
    taxExclusivePrice: "268.55",
  },
  {
    ...volumeBasedPrices[2],
    tax: "31.45",
    taxExclusivePrice: "238.55",
  },
];

const volumeBasedPricesNoTax = [
  {
    ...volumeBasedPrices[0],
    tax: "0.00",
    taxExclusivePrice: "346.00",
  },
  {
    ...volumeBasedPrices[1],
    tax: "0.00",
    taxExclusivePrice: "300.00",
  },
  {
    ...volumeBasedPrices[2],
    tax: "0.00",
    taxExclusivePrice: "270.00",
  },
];

const volumeBasedPricesTaxExclusive = [
  {
    ...volumeBasedPrices[0],
    price: 380.6,
    tax: "34.60",
    taxExclusivePrice: "346.00",
  },
  {
    ...volumeBasedPrices[1],
    price: 330,
    tax: "30.00",
    taxExclusivePrice: "300.00",
  },
  {
    ...volumeBasedPrices[2],
    price: 297,
    tax: "27.00",
    taxExclusivePrice: "270.00",
  },
];

const vbpDisabledProduct = {
  multilingual: [],
  volumeBasedPrices: [],
  createdAt: "2020-07-12T13:04:28.000Z",
  updatedAt: "2022-06-29T05:59:49.000Z",
  deletedAt: null,
  id: 3314,
  name: "Aata Sunridge - 10.KG x1",
  sku: "Retailo-13-000005",
  imageUrl: null,
  description: "",
  stockQuantity: 217600,
  weight: 0,
  length: 0,
  width: 0,
  height: 0,
  price: 2000,
  costPrice: 2500,
  mrp: 1000,
  tradePrice: null,
  size: "",
  unit: "",
  brand: "Sunridge",
  urduName: "Aata Sunridge - 10.KG x1",
  urduUnit: "",
  urduSize: "",
  urduBrand: "",
  disabled: false,
  deletedBy: null,
  updatedBy: 160,
  barcode: "HYPR473455395",
  consentRequired: false,
  locationId: 13,
  taxInclusive: true,
  taxPercent: 10,
  taxCategory: 2,
  deliveryTime: null,
  quantityLimit: null,
  isDynamicPriceEnabled: false,
  isVolumeBasedPriceEnabled: false,
  physicalStock: 56,
};

const vbpEnabledProduct = {
  multilingual: [],
  volumeBasedPrices: volumeBasedPrices,
  createdAt: "2020-11-28T04:12:28.000Z",
  updatedAt: "2022-06-30T09:04:29.000Z",
  deletedAt: null,
  id: 59865,
  name: "Nesfruta Buddy Mango 200ml x24",
  sku: "044-014-00028",
  imageUrl: "",
  description: "",
  stockQuantity: 0,
  weight: 0,
  length: 0,
  width: 0,
  height: 0,
  price: 346,
  costPrice: 346,
  mrp: 346,
  tradePrice: null,
  size: "",
  unit: "",
  brand: "Nesfruta",
  urduName: "",
  urduUnit: "",
  urduSize: "",
  urduBrand: "",
  disabled: false,
  deletedBy: null,
  updatedBy: 228,
  barcode: "HYPR912812761",
  consentRequired: false,
  locationId: 13,
  taxInclusive: false,
  taxPercent: 0,
  taxCategory: 0,
  deliveryTime: null,
  quantityLimit: 69,
  isDynamicPriceEnabled: false,
  isVolumeBasedPriceEnabled: true,
  physicalStock: 0,
};

describe("Arithmos.calculateTaxAndPriceByCategory", () => {
  // VBP Disabled product

  it(
    "should return price and tax for product (VBP Disabled) - tax inclusive, tax on price case",
    test(async () => {
      const product = {
        ...vbpDisabledProduct,
        taxInclusive: true,
        taxPercent: 10,
        taxCategory: 1,
      };

      const inputOutputDict = [
        {
          product,
          quantity: 1,
          isBatchFlow: false,
          expectedResult: {
            price: "1818.18",
            tax: "181.82",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          quantity: 101,
          isBatchFlow: true,
          expectedResult: {
            price: "1818.18",
            tax: "181.82",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          expectedResult: {
            price: "1818.18",
            tax: "181.82",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          quantity: 0,
          expectedResult: {
            price: "1818.18",
            tax: "181.82",
            volumeBasedPriceDetails: {},
          },
        },
      ];

      for (const testCase of inputOutputDict) {
        const actualResult = Arithmos.calculateTaxAndPriceByCategory(
          testCase.product,
          testCase.quantity,
          testCase.isBatchFlow,
        );

        expect(actualResult).to.deep.equalInAnyOrder(testCase.expectedResult);
      }
    }),
  );

  it(
    "should return price and tax for product (VBP Disabled) - tax inclusive, tax on MRP case",
    test(async () => {
      const product = {
        ...vbpDisabledProduct,
        taxInclusive: true,
        taxPercent: 10,
        taxCategory: 2,
      };

      const inputOutputDict = [
        {
          product,
          quantity: 1,
          isBatchFlow: false,
          expectedResult: {
            price: "1909.09",
            tax: "90.91",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          quantity: 101,
          isBatchFlow: true,
          expectedResult: {
            price: "1909.09",
            tax: "90.91",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          expectedResult: {
            price: "1909.09",
            tax: "90.91",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          quantity: 0,
          expectedResult: {
            price: "1909.09",
            tax: "90.91",
            volumeBasedPriceDetails: {},
          },
        },
      ];

      for (const testCase of inputOutputDict) {
        const actualResult = Arithmos.calculateTaxAndPriceByCategory(
          testCase.product,
          testCase.quantity,
          testCase.isBatchFlow,
        );

        expect(actualResult).to.deep.equalInAnyOrder(testCase.expectedResult);
      }
    }),
  );

  it(
    "should return price and tax for product (VBP Disabled) - tax inclusive, tax on MRP case (decimal tax percentage)",
    test(async () => {
      const product = {
        ...vbpDisabledProduct,
        taxInclusive: true,
        taxPercent: 2.56,
        taxCategory: 2,
      };

      const inputOutputDict = [
        {
          product,
          quantity: 1,
          isBatchFlow: false,
          expectedResult: {
            price: "1975.04",
            tax: "24.96",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          quantity: 101,
          isBatchFlow: true,
          expectedResult: {
            price: "1975.04",
            tax: "24.96",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          expectedResult: {
            price: "1975.04",
            tax: "24.96",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          quantity: 0,
          expectedResult: {
            price: "1975.04",
            tax: "24.96",
            volumeBasedPriceDetails: {},
          },
        },
      ];

      for (const testCase of inputOutputDict) {
        const actualResult = Arithmos.calculateTaxAndPriceByCategory(
          testCase.product,
          testCase.quantity,
          testCase.isBatchFlow,
        );

        expect(actualResult).to.deep.equalInAnyOrder(testCase.expectedResult);
      }
    }),
  );

  it(
    "should return price and tax for product (VBP Disabled) - tax inclusive, no tax case",
    test(async () => {
      const product = {
        ...vbpDisabledProduct,
        taxInclusive: true,
        taxPercent: 10,
        taxCategory: 3,
      };

      const inputOutputDict = [
        {
          product,
          quantity: 1,
          isBatchFlow: false,
          expectedResult: {
            price: "2000.00",
            tax: "0.00",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          quantity: 110,
          isBatchFlow: true,
          expectedResult: {
            price: "2000.00",
            tax: "0.00",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          expectedResult: {
            price: "2000.00",
            tax: "0.00",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          quantity: 0,
          expectedResult: {
            price: "2000.00",
            tax: "0.00",
            volumeBasedPriceDetails: {},
          },
        },
      ];

      for (const testCase of inputOutputDict) {
        const actualResult = Arithmos.calculateTaxAndPriceByCategory(
          testCase.product,
          testCase.quantity,
          testCase.isBatchFlow,
        );

        expect(actualResult).to.deep.equalInAnyOrder(testCase.expectedResult);
      }
    }),
  );

  it(
    "should return price and tax for product (VBP Disabled) - tax exclusive, tax on price case",
    test(async () => {
      const product = {
        ...vbpDisabledProduct,
        taxInclusive: false,
        taxPercent: 10,
        taxCategory: 1,
      };

      const inputOutputDict = [
        {
          product,
          quantity: 1,
          isBatchFlow: false,
          expectedResult: {
            price: "2000.00",
            tax: "200.00",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          quantity: 101,
          isBatchFlow: true,
          expectedResult: {
            price: "2000.00",
            tax: "200.00",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          expectedResult: {
            price: "2000.00",
            tax: "200.00",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          quantity: 0,
          expectedResult: {
            price: "2000.00",
            tax: "200.00",
            volumeBasedPriceDetails: {},
          },
        },
      ];

      for (const testCase of inputOutputDict) {
        const actualResult = Arithmos.calculateTaxAndPriceByCategory(
          testCase.product,
          testCase.quantity,
          testCase.isBatchFlow,
        );

        expect(actualResult).to.deep.equalInAnyOrder(testCase.expectedResult);
      }
    }),
  );

  it(
    "should return price and tax for product (VBP Disabled) - tax exclusive, tax on MRP case",
    test(async () => {
      const product = {
        ...vbpDisabledProduct,
        taxInclusive: true,
        taxPercent: 10,
        taxCategory: 2,
      };

      const inputOutputDict = [
        {
          product,
          quantity: 1,
          isBatchFlow: false,
          expectedResult: {
            price: "1909.09",
            tax: "90.91",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          quantity: 105,
          isBatchFlow: true,
          expectedResult: {
            price: "1909.09",
            tax: "90.91",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          expectedResult: {
            price: "1909.09",
            tax: "90.91",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          quantity: 0,
          expectedResult: {
            price: "1909.09",
            tax: "90.91",
            volumeBasedPriceDetails: {},
          },
        },
      ];

      for (const testCase of inputOutputDict) {
        const actualResult = Arithmos.calculateTaxAndPriceByCategory(
          testCase.product,
          testCase.quantity,
          testCase.isBatchFlow,
        );

        expect(actualResult).to.deep.equalInAnyOrder(testCase.expectedResult);
      }
    }),
  );

  it(
    "should return price and tax for product (VBP Disabled) - tax exclusive, no tax case",
    test(async () => {
      const product = {
        ...vbpDisabledProduct,
        taxInclusive: true,
        taxPercent: 10,
        taxCategory: 3,
      };

      const inputOutputDict = [
        {
          product,
          quantity: 1,
          isBatchFlow: false,
          expectedResult: {
            price: "2000.00",
            tax: "0.00",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          quantity: 201,
          isBatchFlow: true,
          expectedResult: {
            price: "2000.00",
            tax: "0.00",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          expectedResult: {
            price: "2000.00",
            tax: "0.00",
            volumeBasedPriceDetails: {},
          },
        },
        {
          product,
          quantity: 0,
          expectedResult: {
            price: "2000.00",
            tax: "0.00",
            volumeBasedPriceDetails: {},
          },
        },
      ];

      for (const testCase of inputOutputDict) {
        const actualResult = Arithmos.calculateTaxAndPriceByCategory(
          testCase.product,
          testCase.quantity,
          testCase.isBatchFlow,
        );

        expect(actualResult).to.deep.equalInAnyOrder(testCase.expectedResult);
      }
    }),
  );

  // VBP Enabled product

  it(
    "should return price and tax for product (VBP Enabled) - tax inclusive, tax on price case",
    test(async () => {
      const product = {
        ...vbpEnabledProduct,
        taxInclusive: true,
        taxPercent: 10,
        taxCategory: 1,
      };

      const inputOutputDict = [
        {
          product,
          quantity: 1,
          isBatchFlow: false,
          expectedResult: {
            price: "314.55",
            tax: "31.45",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesTaxOnPrice,
              volumeBasedPrice: 346,
              selectedTier: 1,
            },
          },
        },
        {
          product,
          quantity: 201,
          isBatchFlow: false,
          expectedResult: {
            price: "245.45",
            tax: "24.55",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesTaxOnPrice,
              volumeBasedPrice: 270,
              selectedTier: 3,
            },
          },
        },
        {
          product,
          quantity: 201,
          isBatchFlow: true,
          expectedResult: {
            price: "314.55",
            tax: "31.45",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
        {
          product,
          expectedResult: {
            price: "314.55",
            tax: "31.45",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
        {
          product,
          quantity: 0,
          expectedResult: {
            price: "314.55",
            tax: "31.45",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
      ];

      for (const testCase of inputOutputDict) {
        const actualResult = Arithmos.calculateTaxAndPriceByCategory(
          testCase.product,
          testCase.quantity,
          testCase.isBatchFlow,
        );

        expect(actualResult).to.deep.equalInAnyOrder(testCase.expectedResult);
      }
    }),
  );

  it(
    "should return price and tax for product (VBP Enabled) - tax inclusive, tax on price case (decimal tax percentage)",
    test(async () => {
      const product = {
        ...vbpEnabledProduct,
        taxInclusive: true,
        taxPercent: 3.98,
        taxCategory: 1,
      };

      const volumeBasedPricesTaxOnPriceDecimal = [
        {
          ...volumeBasedPrices[0],
          tax: "13.24",
          taxExclusivePrice: "332.76",
        },
        {
          ...volumeBasedPrices[1],
          tax: "11.48",
          taxExclusivePrice: "288.52",
        },
        {
          ...volumeBasedPrices[2],
          tax: "10.33",
          taxExclusivePrice: "259.67",
        },
      ];

      const inputOutputDict = [
        {
          product,
          quantity: 1,
          isBatchFlow: false,
          expectedResult: {
            price: "332.76",
            tax: "13.24",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesTaxOnPriceDecimal,
              volumeBasedPrice: 346,
              selectedTier: 1,
            },
          },
        },
        {
          product,
          quantity: 200,
          isBatchFlow: false,
          expectedResult: {
            price: "288.52",
            tax: "11.48",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesTaxOnPriceDecimal,
              volumeBasedPrice: 300,
              selectedTier: 2,
            },
          },
        },
        {
          product,
          quantity: 200,
          isBatchFlow: true,
          expectedResult: {
            price: "332.76",
            tax: "13.24",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
        {
          product,
          expectedResult: {
            price: "332.76",
            tax: "13.24",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
        {
          product,
          quantity: 0,
          expectedResult: {
            price: "332.76",
            tax: "13.24",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
      ];

      for (const testCase of inputOutputDict) {
        const actualResult = Arithmos.calculateTaxAndPriceByCategory(
          testCase.product,
          testCase.quantity,
          testCase.isBatchFlow,
        );

        expect(actualResult).to.deep.equalInAnyOrder(testCase.expectedResult);
      }
    }),
  );

  it(
    "should return price and tax for product (VBP Enabled) - tax inclusive, tax on MRP case",
    test(async () => {
      const product = {
        ...vbpEnabledProduct,
        taxInclusive: true,
        taxPercent: 10,
        taxCategory: 2,
      };

      const inputOutputDict = [
        {
          product,
          quantity: 1,
          isBatchFlow: false,
          expectedResult: {
            price: "314.55",
            tax: "31.45",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesMRP,
              volumeBasedPrice: 346,
              selectedTier: 1,
            },
          },
        },
        {
          product,
          quantity: 301,
          isBatchFlow: false,
          expectedResult: {
            price: "238.55",
            tax: "31.45",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesMRP,
              volumeBasedPrice: 270,
              selectedTier: 3,
            },
          },
        },
        {
          product,
          quantity: 301,
          isBatchFlow: true,
          expectedResult: {
            price: "314.55",
            tax: "31.45",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPrices,
            },
          },
        },
        {
          product,
          quantity: 205,
          expectedResult: {
            price: "238.55",
            tax: "31.45",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesMRP,
              volumeBasedPrice: 270,
              selectedTier: 3,
            },
          },
        },
        {
          product,
          quantity: 0,
          expectedResult: {
            price: "314.55",
            tax: "31.45",
            volumeBasedPriceDetails: { volumeBasedPrices: volumeBasedPrices },
          },
        },
      ];

      for (const testCase of inputOutputDict) {
        const actualResult = Arithmos.calculateTaxAndPriceByCategory(
          testCase.product,
          testCase.quantity,
          testCase.isBatchFlow,
        );

        expect(actualResult).to.deep.equalInAnyOrder(testCase.expectedResult);
      }
    }),
  );

  it(
    "should return price and tax for product (VBP Enabled) - tax inclusive, no tax case",
    test(async () => {
      const product = {
        ...vbpEnabledProduct,
        taxInclusive: true,
        taxPercent: 10,
        taxCategory: 3,
      };

      const inputOutputDict = [
        {
          product,
          quantity: 1,
          isBatchFlow: false,
          expectedResult: {
            price: "346.00",
            tax: "0.00",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesNoTax,
              volumeBasedPrice: 346,
              selectedTier: 1,
            },
          },
        },
        {
          product,
          quantity: 101,
          isBatchFlow: false,
          expectedResult: {
            price: "300.00",
            tax: "0.00",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesNoTax,
              volumeBasedPrice: 300,
              selectedTier: 2,
            },
          },
        },
        {
          product,
          quantity: 101,
          isBatchFlow: true,
          expectedResult: {
            price: "346.00",
            tax: "0.00",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
        {
          product,
          expectedResult: {
            price: "346.00",
            tax: "0.00",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
        {
          product,
          quantity: 0,
          expectedResult: {
            price: "346.00",
            tax: "0.00",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
      ];

      for (const testCase of inputOutputDict) {
        const actualResult = Arithmos.calculateTaxAndPriceByCategory(
          testCase.product,
          testCase.quantity,
          testCase.isBatchFlow,
        );

        expect(actualResult).to.deep.equalInAnyOrder(testCase.expectedResult);
      }
    }),
  );

  it(
    "should return price and tax for product (VBP Enabled) - tax exclusive, tax on price case",
    test(async () => {
      const product = {
        ...vbpEnabledProduct,
        taxInclusive: false,
        taxPercent: 10,
        taxCategory: 1,
      };

      const inputOutputDict = [
        {
          product,
          quantity: 1,
          isBatchFlow: false,
          expectedResult: {
            price: "346.00",
            tax: "34.60",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesTaxExclusive,
              volumeBasedPrice: 346,
              selectedTier: 1,
            },
          },
        },
        {
          product,
          quantity: 121,
          isBatchFlow: false,
          expectedResult: {
            price: "300.00",
            tax: "30.00",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesTaxExclusive,
              volumeBasedPrice: 300,
              selectedTier: 2,
            },
          },
        },
        {
          product,
          quantity: 105,
          isBatchFlow: false,
          expectedResult: {
            price: "300.00",
            tax: "30.00",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesTaxExclusive,
              volumeBasedPrice: 300,
              selectedTier: 2,
            },
          },
        },
        {
          product,
          quantity: 105,
          isBatchFlow: true,
          expectedResult: {
            price: "346.00",
            tax: "34.60",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
        {
          product,
          expectedResult: {
            price: "346.00",
            tax: "34.60",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
        {
          product,
          quantity: 0,
          expectedResult: {
            price: "346.00",
            tax: "34.60",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
      ];

      for (const testCase of inputOutputDict) {
        const actualResult = Arithmos.calculateTaxAndPriceByCategory(
          testCase.product,
          testCase.quantity,
          testCase.isBatchFlow,
        );

        expect(actualResult).to.deep.equalInAnyOrder(testCase.expectedResult);
      }
    }),
  );

  it(
    "should return price and tax for product (VBP Enabled) - tax exclusive, tax on MRP case",
    test(async () => {
      const product = {
        ...vbpEnabledProduct,
        taxInclusive: true,
        taxPercent: 10,
        taxCategory: 2,
      };

      const inputOutputDict = [
        {
          product,
          quantity: 1,
          isBatchFlow: false,
          expectedResult: {
            price: "314.55",
            tax: "31.45",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesMRP,
              volumeBasedPrice: 346,
              selectedTier: 1,
            },
          },
        },
        {
          product,
          quantity: 310,
          isBatchFlow: false,
          expectedResult: {
            price: "238.55",
            tax: "31.45",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesMRP,
              volumeBasedPrice: 270,
              selectedTier: 3,
            },
          },
        },
        {
          product,
          quantity: 310,
          isBatchFlow: true,
          expectedResult: {
            price: "314.55",
            tax: "31.45",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
        {
          product,
          expectedResult: {
            price: "314.55",
            tax: "31.45",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
        {
          product,
          quantity: 0,
          expectedResult: {
            price: "314.55",
            tax: "31.45",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
      ];

      for (const testCase of inputOutputDict) {
        const actualResult = Arithmos.calculateTaxAndPriceByCategory(
          testCase.product,
          testCase.quantity,
          testCase.isBatchFlow,
        );

        expect(actualResult).to.deep.equalInAnyOrder(testCase.expectedResult);
      }
    }),
  );

  it(
    "should return price and tax for product (VBP Enabled) - tax exclusive, no tax case",
    test(async () => {
      const product = {
        ...vbpEnabledProduct,
        taxInclusive: true,
        taxPercent: 10,
        taxCategory: 3,
      };

      const inputOutputDict = [
        {
          product,
          quantity: 1,
          isBatchFlow: false,
          expectedResult: {
            price: "346.00",
            tax: "0.00",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesNoTax,
              volumeBasedPrice: 346,
              selectedTier: 1,
            },
          },
        },
        {
          product,
          quantity: 50,
          isBatchFlow: false,
          expectedResult: {
            price: "346.00",
            tax: "0.00",
            volumeBasedPriceDetails: {
              volumeBasedPrices: volumeBasedPricesNoTax,
              volumeBasedPrice: 346,
              selectedTier: 1,
            },
          },
        },
        {
          product,
          quantity: 50,
          isBatchFlow: true,
          expectedResult: {
            price: "346.00",
            tax: "0.00",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
        {
          product,
          expectedResult: {
            price: "346.00",
            tax: "0.00",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
        {
          product,
          quantity: 0,
          expectedResult: {
            price: "346.00",
            tax: "0.00",
            volumeBasedPriceDetails: { volumeBasedPrices },
          },
        },
      ];

      for (const testCase of inputOutputDict) {
        const actualResult = Arithmos.calculateTaxAndPriceByCategory(
          testCase.product,
          testCase.quantity,
          testCase.isBatchFlow,
        );

        expect(actualResult).to.deep.equalInAnyOrder(testCase.expectedResult);
      }
    }),
  );
});
