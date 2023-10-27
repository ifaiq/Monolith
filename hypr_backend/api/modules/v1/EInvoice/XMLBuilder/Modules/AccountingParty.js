const {
  CAC_TAGS,
  CBC_TAGS,
  ATT_KEY_LIST,
} = require("../Constants");
const {
  builder,
  addNodesToParent,
} = require("../Utils");
const { setID } = require("./id.js");

function setAccountingParty(partyType) {
  return builder.create(partyType).ele(CAC_TAGS.PARTY);
}

function setPartyID(partySchemeType, partySchemeNumber) {
  const parentEle = builder.create(CAC_TAGS.PARTY_ID);

  addNodesToParent(
    parentEle,
    setID(partySchemeNumber).att(ATT_KEY_LIST.SCHEME_ID, partySchemeType),
  );

  return parentEle;
}

function setPostalAddress({
  streetName,
  buildingNumber,
  plotID,
  citySubDivName,
  cityName,
  postalZone,
  countrySubEntity,
  countryIdCode,
}) {
  const parentEle = builder.create(CAC_TAGS.POSTAL_ADDRESS);

  parentEle.ele(CBC_TAGS.STREET_NAME).text(streetName);
  parentEle.ele(CBC_TAGS.BUILDING_NUMBER).text(buildingNumber);
  parentEle.ele(CBC_TAGS.PLOT_ID).text(plotID);
  parentEle.ele(CBC_TAGS.CITY_SUB_DIV_NAME).text(citySubDivName);
  parentEle.ele(CBC_TAGS.CITY_NAME).text(cityName);
  parentEle.ele(CBC_TAGS.POSTAL_ZONE).text(postalZone);
  parentEle.ele(CBC_TAGS.COUNTRY_SUB_ENTITY).text(countrySubEntity);
  parentEle.ele(CAC_TAGS.COUNTRY).ele(CBC_TAGS.ID_CODE).text(countryIdCode);

  return parentEle;
}

function setPartyLegalEntity(regName) {
  const parentEle = builder.create(CAC_TAGS.PARTY_LEGAL_ENTITY);

  parentEle.ele(CBC_TAGS.REG_NAME).text(regName);

  return parentEle;
}

function setPartTaxScheme(companyID = null) {
  const parentEle = builder.create(CAC_TAGS.PARTY_TAX_SCHEME);

  if (companyID) parentEle.ele(CBC_TAGS.COMPANY_ID).text(companyID);

  return parentEle;
}

module.exports = {
  setAccountingParty,
  setPartyID,
  setPostalAddress,
  setPartTaxScheme,
  setPartyLegalEntity,
};
