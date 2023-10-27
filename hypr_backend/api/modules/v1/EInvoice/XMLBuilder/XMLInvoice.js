const moment = require("moment");
const {
  CAC_TAGS,
  ATT_KEY_LIST,
  ATT_VAL_LIST,
  xmlnsTG,
  DS_UBL_EXT_COMPONENT,
  ADR_DATA,
  postalAddress,
} = require("./Constants");
const { builder, addNodesToParent, addSubChildToChild } = require("./Utils");
const { UBL_EXTENSION_COMPONENT } = require("./Modules/Extentions.js");
const DOCUMENT_HEADER = require("./Modules/DocumentHeader.js");
const ADDITIONAL_DOCUMENT_REFERENCE = require("./Modules/AdditionalDocumnetRef.js");
const SIGNATURE = require("./Modules/Signature.js");
const ACCOUNTING_PARTY = require("./Modules/AccountingParty.js");
const DELIVERY = require("./Modules/Delivery.js");
const PAYMENT_MEANS = require("./Modules/PaymentMeans.js");
const TAX_SCHEME = require("./Modules/TaxScheme.js");
const TAX_TOTAL = require("./Modules/TaxTotal.js");
const TAX_CATEGORY = require("./Modules/TaxCategory.js");
const LEGAL_MONETARY_TOTAL = require("./Modules/LegalMonetaryTotal.js");
const INVOICE_LINE = require("./Modules/InvoiceLine.js");
const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../../constants/http");
const logIdentifier = `API version: ${v1}, Context: EInvoiceService.XMLInvoice.generateXML(),`;

const generateXML = (fileName, data = {}) => new Promise((resolve, reject) => {
  // // // // // // // // // // // // // //
  // Creating parent node
  // // // // // // // // // // // // // //
  const Invoice = builder
    .create("Invoice")
    .att(
      ATT_KEY_LIST.XMLNS,
      "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
    )
    .att(
      xmlnsTG("cac"),
      "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    )
    .att(
      xmlnsTG("cbc"),
      "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
    )
    .att(
      xmlnsTG("ext"),
      "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
    );

  // // // // // // // // // // // // // //
  // Adding child node into parent
  // // // // // // // // // // // // // //

  addNodesToParent(Invoice, UBL_EXTENSION_COMPONENT({ ...DS_UBL_EXT_COMPONENT }));

  // Setting DOCUMENT_HEADER
  addNodesToParent(Invoice, DOCUMENT_HEADER.setProfileID());
  addNodesToParent(Invoice, DOCUMENT_HEADER.setID(data.invoiceNumber));
  addNodesToParent(Invoice, DOCUMENT_HEADER.setUUID());
  // eslint-disable-next-line max-len
  addNodesToParent(Invoice, DOCUMENT_HEADER.setIssueDate(moment(data.issueDate, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD")));
  addNodesToParent(Invoice, DOCUMENT_HEADER.setIssueTime(data.issueTimeEn));
  addNodesToParent(Invoice, DOCUMENT_HEADER.setInvoiceTypeCode());
  addNodesToParent(Invoice, DOCUMENT_HEADER.setDocumentCurrencyCode());
  addNodesToParent(Invoice, DOCUMENT_HEADER.setTaxCurrencyCode());
  addNodesToParent(Invoice, DOCUMENT_HEADER.setLineCountNumeric());

  // Setting ADDITIONAL_DOCUMENT_REFERENCE
  for (let i = 0; i < 3; i++) {
    addNodesToParent(
      Invoice,
      ADDITIONAL_DOCUMENT_REFERENCE.setADR(...ADR_DATA[i]),
    );
  }

  //  Setting SIGNATURE
  addNodesToParent(
    Invoice,
    SIGNATURE.setSignature(
      "urn:oasis:names:specification:ubl:signature:Invoice",
      "urn:oasis:names:specification:ubl:dsig:enveloped:xades",
    ),
  );

  // Setting ACCOUNTING_PARTY (Supplier)
  const asp = ACCOUNTING_PARTY.setAccountingParty(
    CAC_TAGS.ACCOUNTING_SUPPLIER_PARTY,
  );
  addNodesToParent(asp, ACCOUNTING_PARTY.setPartyID(ATT_VAL_LIST.MLS, 123457890));
  // TODO: map address according to postalAddress.asp_PA
  // addNodesToParent(asp, ACCOUNTING_PARTY.setPostalAddress(data.seller?.address));
  addNodesToParent(asp, ACCOUNTING_PARTY.setPostalAddress(postalAddress.asp_PA));

  try {
    addNodesToParent(
      asp,
      addSubChildToChild(
        ACCOUNTING_PARTY.setPartTaxScheme(data.seller?.vat),
        TAX_SCHEME(ATT_VAL_LIST.VAT),
      ),
    );
  } catch (error) {
    sails.log(`${logIdentifier} OrderItems: ${JSON.stringify(error)}`);
  }

  addNodesToParent(
    asp,
    ACCOUNTING_PARTY.setPartyLegalEntity(data.seller?.name),
  );
  addNodesToParent(Invoice, asp);

  // Setting ACCOUNTING_PARTY (Customer)
  const acp = ACCOUNTING_PARTY.setAccountingParty(
    CAC_TAGS.ACCOUNTING_CUSTOMER_PARTY,
  );
  addNodesToParent(
    acp,
    ACCOUNTING_PARTY.setPartyID(ATT_VAL_LIST.SAG, "123C12345678"),
  );

  // TODO: map address according to postalAddress.acp_PA
  // addNodesToParent(acp, ACCOUNTING_PARTY.setPostalAddress(data.buyer?.address));
  addNodesToParent(acp, ACCOUNTING_PARTY.setPostalAddress(postalAddress.acp_PA));

  addNodesToParent(
    acp,
    addSubChildToChild(
      ACCOUNTING_PARTY.setPartTaxScheme(data.buyer?.vat),
      TAX_SCHEME(ATT_VAL_LIST.VAT),
    ),
  );
  addNodesToParent(
    acp,
    ACCOUNTING_PARTY.setPartyLegalEntity(data.buyer?.businessName),
  );
  addNodesToParent(Invoice, acp);

  // Setting DELIVERY
  // eslint-disable-next-line max-len
  addNodesToParent(Invoice, DELIVERY.setDelivery(moment(data.supplyDate, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD")));

  // Setting PAYMENT_MEANS
  addNodesToParent(Invoice, PAYMENT_MEANS.setPaymentMeans(10));

  // Setting TAX_TOTAL => TAX_SUBTOTAL
  const ttP = TAX_TOTAL.setTaxTotal(ATT_VAL_LIST.SAR, data.totalTax);
  addNodesToParent(
    ttP,
    addSubChildToChild(
      TAX_TOTAL.setSubTotal(
        { currencyCode: ATT_VAL_LIST.SAR, amount: data.vatExclusiveTotalAmount }, // total taxable amount
        { currencyCode: ATT_VAL_LIST.SAR, amount: data.totalTax },
      ),
      addSubChildToChild(
        TAX_CATEGORY(CAC_TAGS.TAX_CATEGORY, "S", 15),
        TAX_SCHEME(ATT_VAL_LIST.VAT),
      ),
    ),
  );
  addNodesToParent(Invoice, ttP);

  // Setting TAX_TOTAL
  addNodesToParent(Invoice, TAX_TOTAL.setTaxTotal(ATT_VAL_LIST.SAR, data.totalTax));

  // Setting LEGAL_MONETARY_TOTAL
  const lmt = LEGAL_MONETARY_TOTAL.setLegalMonetaryTotal();
  const currencyCode = ATT_VAL_LIST.SAR;

  addNodesToParent(
    lmt,
    LEGAL_MONETARY_TOTAL.setLineExtensionAmount(currencyCode, data.vatExclusiveTotalAmount),
  );

  addNodesToParent(
    lmt,
    LEGAL_MONETARY_TOTAL.setTaxExclusiveAmount(currencyCode, data.vatExclusiveTotalAmount),
  );

  addNodesToParent(
    lmt,
    LEGAL_MONETARY_TOTAL.setTaxInclusiveAmount(currencyCode, data.totalAmount || 0.00),
  );

  addNodesToParent(
    lmt,
    LEGAL_MONETARY_TOTAL.setAllowanceTotalAmount(currencyCode, data.totalDiscount || 0.00),
  );

  addNodesToParent(
    lmt,
    LEGAL_MONETARY_TOTAL.setPayableAmount(currencyCode, data.totalAmount || 0.00),
  );

  addNodesToParent(Invoice, lmt);

  // Setting INVOICE_LINE
  for (let index = 0; index < data.lineItems?.length; index++) {
    const item = data.lineItems[index];
    addInvoiceLine({ ...item, id: index }, Invoice);
  }

  const fullInvoice = Invoice.end({ pretty: true });
  resolve(Buffer.from(fullInvoice, "utf-8"));
});

// // // // // // // // // // // // // //
// Helper function
// // // // // // // // // // // // // //
function addInvoiceLine(item, Invoice, currencyCode = "SAR") {
  const invoiceLine = INVOICE_LINE.setInvoiceLine(item.id, {
    unitCode: ATT_VAL_LIST.PCE,
    value: item.quantity,
  });

  addNodesToParent(
    invoiceLine,
    LEGAL_MONETARY_TOTAL.setLineExtensionAmount(currencyCode, item.taxableAmount),
  );

  addNodesToParent(
    invoiceLine,
    addSubChildToChild(
      TAX_TOTAL.setTaxTotal(currencyCode, item.taxAmount),
      INVOICE_LINE.setRoundingAmount(currencyCode, (item.taxableAmount + item.taxAmount) || 0.00),
    ),
  );

  addNodesToParent(
    invoiceLine,
    addSubChildToChild(
      INVOICE_LINE.setItem(item.nameOfSupply || ""),
      addSubChildToChild(
        TAX_CATEGORY(CAC_TAGS.CLASSIFIED_TAX_CATEGORY, "S", 15),
        TAX_SCHEME(ATT_VAL_LIST.VAT),
      ),
    ),
  );

  addNodesToParent(invoiceLine, INVOICE_LINE.setPrice(currencyCode, item.basePrice));
  addNodesToParent(Invoice, invoiceLine);
}

module.exports = {
  generateXML,
};
