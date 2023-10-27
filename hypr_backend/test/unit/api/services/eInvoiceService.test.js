const rewire = require("rewire");
const randomstring = require("randomstring");
const { chai, expect, sinonChai, test } = require("../../../common");
const eInvoiceServicePath = "../../../../api/modules/v1/EInvoice/EInvoiceService";
const eInvoiceService = rewire(eInvoiceServicePath);

chai.use(sinonChai);

describe("EInvoiceService.generateNewInvoiceNumber", () => {
  it("should return a new invoice number",
    test(async () => {
      let lastInvoiceNumber;
      let newInvoiceNumber;

      // stubbing the getLastInvoiceNumber method
      eInvoiceService.__set__("getLastInvoiceNumber", () => {
        lastInvoiceNumber = randomstring.generate(7);
        return lastInvoiceNumber;
      });

      // stubbing the generateInvoiceNumber method
      eInvoiceService.__set__(
        "generateInvoiceNumber",
        previousInvoiceNumber => {
          newInvoiceNumber = previousInvoiceNumber + 1;
          return newInvoiceNumber;
        },
      );

      const result = await eInvoiceService.generateNewInvoiceNumber();
      expect(result).to.be.equal(newInvoiceNumber);
    }),
  );

  it("should call getLastInvoiceNumber() only once", test(async function () {
    eInvoiceService.__set__("getLastInvoiceNumber", () => randomstring.generate(7));

    eInvoiceService.__set__(
      "generateInvoiceNumber",
      previousInvoiceNumber => previousInvoiceNumber + 1,
    );

    const getLastInvoiceNumberSpy = this.spy(
      eInvoiceService.__get__("getLastInvoiceNumber"),
    );

    eInvoiceService.__set__("getLastInvoiceNumber", getLastInvoiceNumberSpy);

    await eInvoiceService.generateNewInvoiceNumber();
    expect(getLastInvoiceNumberSpy).to.have.been.calledOnce;
  }),
  );

  it("should pass lastInvoiceNumber as param to the 'generateInvoiceNumber' method", test(async function () {
    let lastInvoiceNumber;

    eInvoiceService.__set__("getLastInvoiceNumber", () => {
      lastInvoiceNumber = randomstring.generate(7);
      return lastInvoiceNumber;
    });

    eInvoiceService.__set__(
      "generateInvoiceNumber",
      previousInvoiceNumber => previousInvoiceNumber + 1,
    );

    const generateInvoiceNumberSpy = this.spy(
      eInvoiceService.__get__("generateInvoiceNumber"),
    );

    eInvoiceService.__set__(
      "generateInvoiceNumber",
      generateInvoiceNumberSpy,
    );

    await eInvoiceService.generateNewInvoiceNumber();

    expect(generateInvoiceNumberSpy).to.have.been.calledWith(lastInvoiceNumber);
  }),
  );

  it(
    "should call generateInvoiceNumber() once",
    test(async function () {
      eInvoiceService.__set__("getLastInvoiceNumber", () => randomstring.generate(7));

      eInvoiceService.__set__(
        "generateInvoiceNumber",
        previousInvoiceNumber => previousInvoiceNumber + 1,
      );

      const generateInvoiceNumberSpy = this.spy(
        eInvoiceService.__get__("generateInvoiceNumber"),
      );

      eInvoiceService.__set__(
        "generateInvoiceNumber",
        generateInvoiceNumberSpy,
      );

      await eInvoiceService.generateNewInvoiceNumber();
      expect(generateInvoiceNumberSpy).to.have.been.calledOnce;
    }),
  );
});
