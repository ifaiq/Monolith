const { request, expect } = require("../../common-imports");
const {
  authTokens: { CONSUMER_TOKEN_LOC_198 },
  constants: { TEST_TIMEOUT, prefix, v1, locationId },
} = require("../../constants");

const {
  categories,
  nonJitCartProducts,
  multipleProductsOrder,
  createCategoriesAndProducts,
} = require("../../stubs/products-categories-stubs");

const cartService = `/${prefix}/${v1}/cart`;

describe("api/v1/cart (PUT)", () => {
  it(
    "should calculate single shipment cart [Customer token]",
    async () => {
      await createCategoriesAndProducts(categories, [nonJitCartProducts[0]]);

      const response = await request(sails.hooks.http.app)
        .put(cartService)
        .query({
          calculateTotal: true,
          validateCoupon: true,
          validateProducts: true,
        })
        .send({
          locationId,
          paymentType: "COD",
          products: [
            {
              id: 1,
              quantity: 1,
            },
          ],
        })
        .set("Authorization", CONSUMER_TOKEN_LOC_198)
        .expect(200);

      expect(response.body.data.shipments).to.have.lengthOf(1);
      expect(response.body.data.products).to.all.have.property("expectedDeliveryDate");

      delete response.body.data.shipments;
      response.body.data.products.forEach(productItem => {
        delete productItem.createdAt;
        delete productItem.updatedAt;
        delete productItem.expectedDeliveryDate;
        return productItem;
      });

      expect(response.body).to.eql({
        success: true,
        code: "OK",
        message: "Operation is successfully executed",
        userMessage: "Cart updated successfully!",
        data: {
          locationId,
          paymentType: "COD",
          products: [
            {
              barcode: "HYPR473455395",
              brand: "Sunridge",
              consentRequired: false,
              costPrice: 2500,
              createdBy: 160,
              deletedAt: null,
              deletedBy: null,
              deliveryTime: null,
              description: null,
              disabled: false,
              discount: "",
              height: 0,
              id: 1,
              imageUrl: "",
              isVolumeBasedPriceCalculated: false,
              isVolumeBasedPriceEnabled: false,
              length: 0,
              locationId,
              mrp: 3000,
              name: "Aata Sunridge - 10.KG x1",
              physicalStock: 443,
              price: 2000,
              quantity: 1,
              quantityLimit: null,
              size: "",
              sku: "Retailo-13-000005",
              stockQuantity: 217683,
              tax: "272.73",
              taxCategory: 2,
              taxInclusive: true,
              taxPercent: 10,
              total: 2000,
              tradePrice: "",
              unit: "",
              updatedBy: 160,
              urduBrand: "",
              urduName: "Aata Sunridge - 10.KG x1",
              urduSize: "",
              urduUnit: "",
              volumeBasedPriceInfo: {},
              weight: 0,
              width: 0,
              isDynamicPriceEnabled: false,
              marketplaceFvr: false,
            },
          ],
          retailerId: 10523,
          tax: 272.73,
          taxAmount: 0,
          grandTotal: 2000,
          subTotal: 2000,
          total: 1727.27,
          couponDiscount: 0,
          eligibleProducts: [],
          remainingPriceForFreeDelivery: 0,
          deliveryCharges: 0,
          waiver: 0,
          amountPayable: 2000,
          volumeBasedDiscount: 0,
          currency: "PKR",
        },
      });
    },
    TEST_TIMEOUT,
  );

  it(
    "should calculate multiple shipments cart [Customer token]",
    async () => {
      await createCategoriesAndProducts(categories, multipleProductsOrder);

      const response = await request(sails.hooks.http.app)
        .put(cartService)
        .query({
          calculateTotal: true,
          validateCoupon: true,
          validateProducts: true,
        })
        .send({
          locationId,
          paymentType: "COD",
          products: [
            {
              id: 1,
              quantity: 4,
            },
            {
              id: 2,
              quantity: 13,
            },
            {
              id: 3,
              quantity: 2,
            },
          ],
        })
        .set("Authorization", CONSUMER_TOKEN_LOC_198)
        .expect(200);

      expect(response.body.data.shipments.length).to.have.oneOf([2, 3]);
      expect(response.body.data.products).to.all.have.property("expectedDeliveryDate");

      delete response.body.data.shipments;
      response.body.data.products.forEach(productItem => {
        delete productItem.createdAt;
        delete productItem.updatedAt;
        delete productItem.expectedDeliveryDate;
        return productItem;
      });

      expect(response.body).to.eql({
        code: "OK",
        message: "Operation is successfully executed",
        userMessage: "Cart updated successfully!",
        data: {
          locationId,
          paymentType: "COD",
          products: [
            {
              deletedAt: null,
              id: 1,
              name: "non-jit-cerelac-sku",
              sku: "non-jit-cerelac-sku",
              imageUrl: null,
              description: null,
              stockQuantity: 10000,
              weight: null,
              length: null,
              width: null,
              height: null,
              price: 100,
              costPrice: 100,
              mrp: 120,
              tradePrice: "",
              size: "",
              unit: "",
              brand: "",
              urduName: "",
              urduUnit: "",
              urduSize: "",
              urduBrand: "",
              disabled: false,
              deletedBy: null,
              updatedBy: 160,
              barcode: "HYPR923090703",
              consentRequired: false,
              locationId,
              taxInclusive: false,
              taxPercent: 10,
              taxCategory: 3,
              deliveryTime: null,
              quantityLimit: null,
              isVolumeBasedPriceEnabled: false,
              physicalStock: 20,
              createdBy: 160,
              tax: "0.00",
              isVolumeBasedPriceCalculated: false,
              volumeBasedPriceInfo: {},
              quantity: 4,
              total: 400,
              discount: "",
              isDynamicPriceEnabled: false,
              marketplaceFvr: false,
            },
            {
              deletedAt: null,
              id: 2,
              name: "chai",
              sku: "sku-tapal-chai",
              imageUrl: null,
              description: null,
              stockQuantity: 12000,
              weight: null,
              length: null,
              width: null,
              height: null,
              price: 100,
              costPrice: 98,
              mrp: 120,
              tradePrice: 200,
              size: "1kg",
              unit: "1000",
              brand: "tapal",
              urduName: "",
              urduUnit: "",
              urduSize: "",
              urduBrand: "",
              disabled: false,
              deletedBy: null,
              updatedBy: 160,
              barcode: "HYPR803983581",
              consentRequired: false,
              locationId,
              taxInclusive: true,
              taxPercent: 1,
              taxCategory: 1,
              deliveryTime: 55,
              quantityLimit: null,
              isVolumeBasedPriceEnabled: false,
              physicalStock: 1200,
              createdBy: 160,
              tax: "0.99",
              isVolumeBasedPriceCalculated: false,
              volumeBasedPriceInfo: {},
              quantity: 13,
              total: 1300,
              discount: 50,
              isDynamicPriceEnabled: false,
              marketplaceFvr: false,
            },
            {
              deletedAt: null,
              id: 3,
              name: "everyday milk",
              sku: "sku-PAK-everyday",
              imageUrl: null,
              description: null,
              stockQuantity: 32000,
              weight: null,
              length: null,
              width: null,
              height: null,
              price: 250,
              costPrice: 98,
              mrp: 220,
              tradePrice: 260,
              size: "1kg",
              unit: "2000",
              brand: "tapal",
              urduName: "",
              urduUnit: "",
              urduSize: "",
              urduBrand: "",
              disabled: false,
              deletedBy: null,
              updatedBy: 160,
              barcode: "HYPR803983581",
              consentRequired: false,
              locationId,
              taxInclusive: true,
              taxPercent: 2,
              taxCategory: 1,
              deliveryTime: 96,
              quantityLimit: null,
              isVolumeBasedPriceEnabled: false,
              physicalStock: 3,
              createdBy: 160,
              tax: "4.90",
              isVolumeBasedPriceCalculated: false,
              volumeBasedPriceInfo: {},
              quantity: 2,
              total: 500,
              discount: 3.85,
              isDynamicPriceEnabled: false,
              marketplaceFvr: false,
            },
          ],
          retailerId: 10523,
          tax: 22.67,
          taxAmount: 0,
          grandTotal: 2250,
          subTotal: 2250,
          total: 2177.33,
          couponDiscount: 0,
          eligibleProducts: [],
          remainingPriceForFreeDelivery: 2800,
          deliveryCharges: 50,
          waiver: 0,
          amountPayable: 2250,
          volumeBasedDiscount: 0,
          currency: "PKR",
        },
        success: true,
      });
    },
    TEST_TIMEOUT,
  );
});
