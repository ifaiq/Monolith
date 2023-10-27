/* eslint-disable max-len */
// Tag generators (TG)
const cacTG = tagName => `cac:${tagName}`;
const cbcTG = tagName => `cbc:${tagName}`;
const extTG = tagName => `ext:${tagName}`;
const sigTG = tagName => `sig:${tagName}`;
const sacTG = tagName => `sac:${tagName}`;
const sbcTG = tagName => `sbc:${tagName}`;
const dsTG = tagName => `ds:${tagName}`;
const xadesTG = tagName => `xades:${tagName}`;

// cac Tags
const CAC_TAGS = {
  ITEM: cacTG("Item"),
  PRICE: cacTG("Price"),
  PARTY: cacTG("Party"),
  COUNTRY: cacTG("Country"),
  PARTY_ID: cacTG("PartyIdentification"),
  DELIVERY: cacTG("Delivery"),
  TAX_TOTAL: cacTG("TaxTotal"),
  SIGNATURE: cacTG("Signature"),
  TAX_SCHEME: cacTG("TaxScheme"),
  ATTACHMENT: cacTG("Attachment"),
  TAX_SUBTOTAL: cacTG("TaxSubtotal"),
  TAX_CATEGORY: cacTG("TaxCategory"),
  INVOICE_LINE: cacTG("InvoiceLine"),
  PAYMENT_MEANS: cacTG("PaymentMeans"),
  POSTAL_ADDRESS: cacTG("PostalAddress"),
  PARTY_TAX_SCHEME: cacTG("PartyTaxScheme"),
  PARTY_LEGAL_ENTITY: cacTG("PartyLegalEntity"),
  LEGAL_MONETARY_TOTAL: cacTG("LegalMonetaryTotal"),
  CLASSIFIED_TAX_CATEGORY: cacTG("ClassifiedTaxCategory"),
  ACCOUNTING_CUSTOMER_PARTY: cacTG("AccountingCustomerParty"),
  ACCOUNTING_SUPPLIER_PARTY: cacTG("AccountingSupplierParty"),
  ADDITIONAL_DOCUMENT_REFERENCE: cacTG("AdditionalDocumentReference"),
};

// cbc Tags
const CBC_TAGS = {
  ID: cbcTG("ID"),
  UUID: cbcTG("UUID"),
  NAME: cbcTG("Name"),
  PERCENT: cbcTG("Percent"),
  ID_CODE: cbcTG("IdentificationCode"),
  PLOT_ID: cbcTG("PlotIdentification"),
  REG_NAME: cbcTG("RegistrationName"),
  CITY_NAME: cbcTG("CityName"),
  COMPANY_ID: cbcTG("CompanyID"),
  PROFILE_ID: cbcTG("ProfileID"),
  ISSUE_DATE: cbcTG("IssueDate"),
  ISSUE_TIME: cbcTG("IssueTime"),
  TAX_AMOUNT: cbcTG("TaxAmount"),
  EDB_OBJECT: cbcTG("EmbeddedDocumentBinaryObject"),
  POSTAL_ZONE: cbcTG("PostalZone"),
  STREET_NAME: cbcTG("StreetName"),
  PRICE_AMOUNT: cbcTG("PriceAmount"),
  TAXABLE_AMOUNT: cbcTG("TaxableAmount"),
  TAX_EXC_AMOUNT: cbcTG("TaxExclusiveAmount"),
  TAX_INC_AMOUNT: cbcTG("TaxInclusiveAmount"),
  PAYABLE_AMOUNT: cbcTG("PayableAmount"),
  BUILDING_NUMBER: cbcTG("BuildingNumber"),
  ROUNDING_AMOUNT: cbcTG("RoundingAmount"),
  LINE_EXT_AMOUNT: cbcTG("LineExtensionAmount"),
  SIGNATURE_METHOD: cbcTG("SignatureMethod"),
  INVOICE_TYPE_CODE: cbcTG("InvoiceTypeCode"),
  DOC_CURRENCY_CODE: cbcTG("DocumentCurrencyCode"),
  TAX_CURRENCY_CODE: cbcTG("TaxCurrencyCode"),
  INVOICED_QUANTITY: cbcTG("InvoicedQuantity"),
  CITY_SUB_DIV_NAME: cbcTG("CitySubdivisionName"),
  PAYMENT_MEANS_CODE: cbcTG("PaymentMeansCode"),
  COUNTRY_SUB_ENTITY: cbcTG("CountrySubentity"),
  LINE_COUNT_NUMERIC: cbcTG("LineCountNumeric"),
  ACTUAL_DELIVERY_DATE: cbcTG("ActualDeliveryDate"),
  ALLOWANCE_TOTAL_AMOUNT: cbcTG("AllowanceTotalAmount"),
};

// EXT Tags
const EXT_TAGS = {
  UBL_EXTENSIONS: extTG("UBLExtensions"),
  UBL_EXTENSION: extTG("UBLExtension"),
  EXTENSION_URI: extTG("ExtensionURI"),
  EXTENSION_CONTENT: extTG("ExtensionContent"),
};

// UNI Tags
const SIG_TAG = {
  UBL_DOC_SIG: sigTG("UBLDocumentSignatures"),
};

const SAC_TAG = {
  SIGNATURE_INFO: sacTG("SignatureInformation"),
};

const SBC_TAG = {
  REF_SIGNATURE_ID: sbcTG("ReferencedSignatureID"),
};

// DS Tags
const DS_TAGS = {
  X_PATH: dsTG("XPath"),
  OBJECT: dsTG("Object"),
  KEY_INFO: dsTG("KeyInfo"),
  REFERENCE: dsTG("Reference"),
  SIGNATURE: dsTG("Signature"),
  TRANSFORM: dsTG("Transform"),
  X590_DATA: dsTG("X509Data"),
  TRANSFORMS: dsTG("Transforms"),
  SIGNED_INFO: dsTG("SignedInfo"),
  DIGEST_VALUE: dsTG("DigestValue"),
  DIGEST_METHOD: dsTG("DigestMethod"),
  SIGNATURE_VALUE: dsTG("SignatureValue"),
  SIGNATURE_METHOD: dsTG("SignatureMethod"),
  X509_CERTIFICATE: dsTG("X509Certificate"),
  X509_ISSUER_NAME: dsTG("X509IssuerName"),
  X509_SERIAL_NUMBER: dsTG("X509SerialNumber"),
  CANONICALIZATION_METHOD: dsTG("CanonicalizationMethod"),
};

// XADES Tags
const XADES_TAGS = {
  QUALIFYING_PROPERTIES: xadesTG("QualifyingProperties"),
  SIGNED_PROPERTIES: xadesTG("SignedProperties"),
  SIGNED_SIGNATURE_PROPS: xadesTG("SignedSignatureProperties"),
  SIGNING_TIME: xadesTG("SigningTime"),
  SIGNING_CERTIFICATRE: xadesTG("SigningCertificate"),
  CRET: xadesTG("Cert"),
  CRET_DIGEST: xadesTG("CertDigest"),
  ISSUER_SERIAL: xadesTG("IssuerSerial"),
};

// Attribute key list
const ATT_KEY_LIST = {
  NAME: "name",
  UNIT_CODE: "unitCode",
  SCHEME_ID: "schemeID",
  MIME_CODE: "mimeCode",
  CURRENCY_ID: "currencyID",
  XMLNS: "xmlns",
  ID: "Id",
  ALGO: "Algorithm",
  URI: "URI",
  TYPE: "Type",
  TARGET: "Target",
};

const xmlnsTG = tagName => `${ATT_KEY_LIST.XMLNS}:${tagName}`;

// Attribute value list
const ATT_VAL_LIST = {
  PCE: "PCE",
  SAR: "SAR",
  VAT: "VAT",
  SAG: "SAG",
  MLS: "MLS",
  PIH: "PIH",
  ICV: "ICV",
  QR: "QR",
  TXT_PLAIN: "text/plain",
};

// UBL Extention Component Data
const DS_UBL_EXT_COMPONENT = {
  URI: "urn:oasis:names:specification:ubl:dsig:enveloped:xades",
  UBL_DOC_SIGNATURES: {
    SAC_SIGNATURE:
      "urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2",
    SBC_SIGNATURE:
      "urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2",
    SIG_SIGNATURE:
      "urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2",
  },
  SIGNATURE_INFO: {
    SIGNATURE_ID: "urn:oasis:names:specification:ubl:signature:1",
    REF_SIGNATURE_ID:
      "urn:oasis:names:specification:ubl:signature:Invoicesadas",
  },
  SIGNATURE: {
    SIGNATURE_REF: "http://www.w3.org/2000/09/xmldsig#",
    ID_TYPE: "signature",
  },
  ALGO_REF: {
    CM: "http://www.w3.org/2006/12/xml-c14n11",
    SM: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
  },
  REFERENCE: [
    {
      REF: {
        ATT_TYPE: ATT_KEY_LIST.ID,
        ATT_VALUE: "invoiceSignedData",
        URI: "",
      },
      DIGEST: {
        ALGO_REF: "http://www.w3.org/2001/04/xmlenc#sha256",
        VALUE:
          "24032ad69f6be690a302d02846f7ad29070a3c86cf2d3d872977b4b8a1d49e25",
      },
      TRANSFORM: [
        {
          ALGO_REF: "http://www.w3.org/TR/1999/REC-xpath-19991116",
          X_PATH: "not(//ancestor-or-self::ext:UBLExtensions)",
        },
        {
          ALGO_REF: "http://www.w3.org/TR/1999/REC-xpath-19991116",
          X_PATH: "not(//ancestor-or-self::cac:Signature)",
        },
        {
          ALGO_REF: "http://www.w3.org/TR/1999/REC-xpath-19991116",
          X_PATH:
            "not(//ancestor-or-self::cac:AdditionalDocumentReference[cbc:ID='QR'])",
        },
        {
          ALGO_REF: "http://www.w3.org/2006/12/xml-c14n11",
          X_PATH: "",
        },
      ],
    },
    {
      REF: {
        ATT_TYPE: ATT_KEY_LIST.TYPE,
        ATT_VALUE: "http://www.w3.org/2000/09/xmldsig#SignatureProperties",
        URI: "#xadesSignedProperties",
      },
      DIGEST: {
        ALGO_REF: "http://www.w3.org/2001/04/xmlenc#sha256",
        VALUE:
          "2ab365b063238318fdeac9c2957b135ef8a6727691fc4d81982b5bdd2cec9792",
      },
      TRANSFORM: null,
    },
  ],
  SIGNATURE_VALUE:
    "MEUCIF/rcZ3HlUYNIXje9NUK5GOz88ot98CCXzDsR/R2BjurAiEApvaCBC71VmhbM4wltnNrY2pHeL/8owu28ZouMWKDww4=",
  KEY_INFO_VALUE:
    "MIIBmzCCAUECCQDQROomkk8YkDAKBggqhkjOPQQDAjBWMQswCQYDVQQGEwJQTDEQMA4GA1UECAwHU2lsZXNpYTERMA8GA1UEBwwIS2F0b3dpY2UxDTALBgNVBAoMBEdBWlQxEzARBgNVBAMMCkNvbW1vbk5hbWUwIBcNMjEwOTA2MTgwOTA1WhgPNDQ4NTEwMTgxODA5MDVaMFYxCzAJBgNVBAYTAlBMMRAwDgYDVQQIDAdTaWxlc2lhMREwDwYDVQQHDAhLYXRvd2ljZTENMAsGA1UECgwER0FaVDETMBEGA1UEAwwKQ29tbW9uTmFtZTBWMBAGByqGSM49AgEGBSuBBAAKA0IABJboxJQD/AlFyPQCWM3S2ekwGnkhKpOnyP+tjsLYFcJfLLTdX+U/uOfQtKAm/KRXI1E9d8DjOOkVFo5Q1ZQE25QwCgYIKoZIzj0EAwIDSAAwRQIhANULHFfKoroAMgdoUQJ/UwjhD3xHgMeAXjgVpZftENoYAiB7WFgx0hLuJTJbLpYCzpzdpWVOXrIr8g4XvtWKl02j1w==",
  QUALIFYING_PROPERTIES: {
    REF: "http://uri.etsi.org/01903/v1.3.2#",
    TARGET: "signature",
  },
  SIGNED_PROPS_ID_TYPE: "xadesSignedProperties",
  SIGNING_DATETIME: "2021-02-25T12:57:51Z",
  CRET_DIGEST: {
    ALGO_REF: "http://www.w3.org/2001/04/xmlenc#sha256",
    VALUE: "9ef6c0b90ae609868bb614772e1d5375464ed1a1793ded751feb1e3414980f7c",
  },
  ISSUER: {
    NAME: "CN=CommonName,O=GAZT,L=Katowice,ST=Silesia,C=PL",
    SERIAL_NUMBER: "15007377309689649296",
  },
};

// console.log(DS_UBL_EXT_COMPONENT.REFERENCE);

// Additional Document Reference Data
const ADR_DATA = [
  [
    ATT_VAL_LIST.ICV,
    {
      docType: "UUID",
      docValue: 46531,
    },
  ],
  [
    ATT_VAL_LIST.PIH,
    {
      docType: "Attachment",
      docValue:
        "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==",
    },
  ],
  [
    ATT_VAL_LIST.QR,
    {
      docType: "Attachment",
      docValue:
        "ARlBbCBTYWxhbSBTdXBwbGllcyBDby4gTFREAg8zMTAxNzUzOTc0MDAwMDMDFDIwMjEtMDQtMjVUMTU6MzA6MDBaBAcxMDM1LjAwBQYxMzUuMDAGLGo0K3dET2FSTFJRbjdvd2VvQ2JvYjFXRGFxUFJDVEh6b25uMDhiK2RKcjA9B4GwMzA1NjMwMTAwNjA3MmE4NjQ4Y2UzZDAyMDEwNjA1MmI4MTA0MDAwYTAzNDIwMDA0OTZlOGM0OTQwM2ZjMDk0NWM4ZjQwMjU4Y2RkMmQ5ZTkzMDFhNzkyMTJhOTNhN2M4ZmZhZDhlYzJkODE1YzI1ZjJjYjRkZDVmZTUzZmI4ZTdkMGI0YTAyNmZjYTQ1NzIzNTEzZDc3YzBlMzM4ZTkxNTE2OGU1MGQ1OTQwNGRiOTQIILDmL87RImpgalwSxEN7DVidfKQS9ffWYI5GIc7GyJdrCSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
    },
  ],
];

// Postal Address
const postalAddress = {
  asp_PA: {
    streetName: "King Abdulaziz Road",
    buildingNumber: 8228,
    plotID: 2121,
    citySubDivName: "Al Amal",
    cityName: "Riyadh",
    postalZone: 12643,
    countrySubEntity: "Riyadh Region",
    countryIdCode: "SA",
  },
  acp_PA: {
    streetName: "King Abdullah Road",
    buildingNumber: 3709,
    plotID: 1004,
    citySubDivName: "Al Mursalat",
    cityName: "Riyadh",
    postalZone: 11564,
    countrySubEntity: "Riyadh Region",
    countryIdCode: "SA",
  },
};


module.exports = {
  CAC_TAGS,
  CBC_TAGS,
  EXT_TAGS,
  SIG_TAG,
  SAC_TAG,
  SBC_TAG,
  DS_TAGS,
  XADES_TAGS,
  ATT_KEY_LIST,
  ATT_VAL_LIST,
  xmlnsTG,
  // demy data
  DS_UBL_EXT_COMPONENT,
  ADR_DATA,
  postalAddress,
};
