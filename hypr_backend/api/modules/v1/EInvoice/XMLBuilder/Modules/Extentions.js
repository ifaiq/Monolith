const { setID } = require("./id.js");
const {
  builder,
  addNodesToParent,
  addSubChildToChild,
} = require("../Utils");
const {
  EXT_TAGS,
  SIG_TAG,
  SAC_TAG,
  SBC_TAG,
  DS_TAGS,
  XADES_TAGS,
  ATT_KEY_LIST,
  xmlnsTG,
} = require("../Constants");

function setUBL_Extentions(uri) {
  const parentEle = builder
    .create(EXT_TAGS.UBL_EXTENSIONS)
    .ele(EXT_TAGS.UBL_EXTENSION);

  parentEle.ele(EXT_TAGS.EXTENSION_URI).text(uri);

  return parentEle;
}

function setExtentionContent() {
  return builder.create(EXT_TAGS.EXTENSION_CONTENT);
}

function setUBL_DOC_Signatures(sacSignature, sbcSignature, sigSignature) {
  return builder
    .create(SIG_TAG.UBL_DOC_SIG)
    .att(xmlnsTG("sac"), sacSignature)
    .att(xmlnsTG("sbc"), sbcSignature)
    .att(xmlnsTG("sig"), sigSignature);
}

function setSignatureInformation(signatureID, refSignatureID) {
  const parentEle = builder.create(SAC_TAG.SIGNATURE_INFO);

  addNodesToParent(parentEle, setID(signatureID));
  parentEle.ele(SBC_TAG.REF_SIGNATURE_ID).text(refSignatureID);

  return parentEle;
}

function setSignature(ref, id_Type) {
  return builder
    .create(DS_TAGS.SIGNATURE)
    .att(xmlnsTG("ds"), ref)
    .att(ATT_KEY_LIST.ID, id_Type);
}

function setSignedInfo(algoRef_CM, algoRef_SM) {
  const parentEle = builder.create(DS_TAGS.SIGNED_INFO);

  parentEle
    .ele(DS_TAGS.CANONICALIZATION_METHOD)
    .att(ATT_KEY_LIST.ALGO, algoRef_CM);
  parentEle.ele(DS_TAGS.SIGNATURE_METHOD).att(ATT_KEY_LIST.ALGO, algoRef_SM);

  return parentEle;
}

function setReference(
  REF = { ATT_TYPE, ATT_VALUE, URI },
  DIGEST = { ALGO_REF, VALUE },
  TRANSFORM = [{ ALGO_REF, X_PATH }],
) {
  const parentEle = builder
    .create(DS_TAGS.REFERENCE)
    .att(REF.ATT_TYPE, REF.ATT_VALUE)
    .att(ATT_KEY_LIST.URI, REF.URI);

  if (TRANSFORM) {
    const transformsContent = setTransforms();

    TRANSFORM.forEach(value => {
      const node = setTransform(value.ALGO_REF, value.X_PATH);
      addSubChildToChild(transformsContent, node);
    });

    addNodesToParent(parentEle, transformsContent);
  }

  addNodesToParent(parentEle, setDigestMethod(DIGEST.ALGO_REF));
  addNodesToParent(parentEle, setDigestValue(DIGEST.VALUE));

  return parentEle;
}

function setDigestMethod(alogRef) {
  return builder.create(DS_TAGS.DIGEST_METHOD).att(ATT_KEY_LIST.ALGO, alogRef);
}

function setDigestValue(value) {
  return builder.create(DS_TAGS.DIGEST_VALUE).text(value);
}

function setTransforms() {
  return builder.create(DS_TAGS.TRANSFORMS);
}

function setTransform(algo_Ref, path) {
  const parentEle = builder
    .create(DS_TAGS.TRANSFORM)
    .att(ATT_KEY_LIST.ALGO, algo_Ref);

  if (path) parentEle.ele(DS_TAGS.X_PATH).text(path);

  return parentEle;
}

function setSignatureValue(value) {
  return builder.create(DS_TAGS.SIGNATURE_VALUE).text(value);
}

function setKeyInfo(value) {
  return builder
    .create(DS_TAGS.KEY_INFO)
    .ele(DS_TAGS.X590_DATA)
    .ele(DS_TAGS.X509_CERTIFICATE)
    .txt(value);
}

function setObject(ref, type, idValue) {
  return builder
    .create(DS_TAGS.OBJECT)
    .ele(XADES_TAGS.QUALIFYING_PROPERTIES)
    .att(xmlnsTG("xades"), ref)
    .att(ATT_KEY_LIST.TARGET, type)
    .ele(XADES_TAGS.SIGNED_PROPERTIES)
    .att(ATT_KEY_LIST.ID, idValue);
}

function setSignedSignatureProps(signingDateTime) {
  const parentEle = builder.create(XADES_TAGS.SIGNED_SIGNATURE_PROPS);

  parentEle.ele(XADES_TAGS.SIGNING_TIME).text(signingDateTime);

  return parentEle;
}

function setSigningCertificate() {
  return builder.create(XADES_TAGS.SIGNING_CERTIFICATRE).ele(XADES_TAGS.CRET);
}

function setCretDigest(algoRef, value) {
  const parentEle = builder.create(XADES_TAGS.CRET_DIGEST);

  addNodesToParent(parentEle, setDigestMethod(algoRef));
  addNodesToParent(parentEle, setDigestValue(value));

  return parentEle;
}

function setIssuerSerial(issuerName, issuerSerialNumber) {
  const parentEle = builder.create(XADES_TAGS.ISSUER_SERIAL);

  parentEle.ele(DS_TAGS.X509_ISSUER_NAME).text(issuerName);
  parentEle.ele(DS_TAGS.X509_SERIAL_NUMBER).text(issuerSerialNumber);

  return parentEle;
}

function UBL_EXTENSION_COMPONENT({
  URI,
  UBL_DOC_SIGNATURES = {
    SAC_SIGNATURE: "",
    SBC_SIGNATURE: "",
    SIG_SIGNATURE: "",
  },
  SIGNATURE_INFO = {
    SIGNATURE_ID: "",
    REF_SIGNATURE_ID: "",
  },
  SIGNATURE = {
    SIGNATURE_REF: "",
    ID_TYPE: "",
  },
  ALGO_REF = {
    CM: "",
    SM: "",
  },
  REFERENCE = [
    {
      REF: { ID_TYPE: "", URI: "" },
      DIGEST: {
        ALGO_REF: "",
        VALUE: "",
      },
      TRANSFORM: [{ ALGO_REF: "", X_PATH: "" }],
    },
  ],
  SIGNATURE_VALUE = "",
  KEY_INFO_VALUE = "",
  QUALIFYING_PROPERTIES = {
    REF: "",
    TARGET: "",
  },
  SIGNED_PROPS_ID_TYPE = "",
  SIGNING_DATETIME = "",
  CRET_DIGEST = {
    ALGO_REF: "",
    VALUE: "",
  },
  ISSUER = {
    NAME: "",
    SERIAL_NUMBER: "",
  },
}) {
  const parentEle = setUBL_Extentions(URI);

  let childEle = setUBL_DOC_Signatures(
    UBL_DOC_SIGNATURES.SAC_SIGNATURE,
    UBL_DOC_SIGNATURES.SBC_SIGNATURE,
    UBL_DOC_SIGNATURES.SIG_SIGNATURE,
  );

  let sigParentEle = setSignatureInformation(
    SIGNATURE_INFO.SIGNATURE_ID,
    SIGNATURE_INFO.REF_SIGNATURE_ID,
  );

  // Signature Parent Component
  let sigChildEle = setSignature(SIGNATURE.SIGNATURE_REF, SIGNATURE.ID_TYPE);

  // Signed Info Parent Component
  let sigSubChildEle = setSignedInfo(ALGO_REF.CM, ALGO_REF.SM);

  sigSubChildEle = addSubChildToChild(
    sigSubChildEle,
    setReference(
      { ...REFERENCE[0].REF },
      { ...REFERENCE[0].DIGEST },
      REFERENCE[0].TRANSFORM,
    ),
  );

  sigSubChildEle = addSubChildToChild(
    sigSubChildEle,
    setReference(
      { ...REFERENCE[1].REF },
      { ...REFERENCE[1].DIGEST },
      REFERENCE[1].TRANSFORM,
    ),
  );

  sigChildEle = addSubChildToChild(sigChildEle, sigSubChildEle);

  sigChildEle = addSubChildToChild(
    sigChildEle,
    setSignatureValue(SIGNATURE_VALUE),
  );

  sigChildEle = addSubChildToChild(sigChildEle, setKeyInfo(KEY_INFO_VALUE));

  let objChildEle = setObject(
    QUALIFYING_PROPERTIES.REF,
    QUALIFYING_PROPERTIES.TARGET,
    SIGNED_PROPS_ID_TYPE,
  );

  let sigPropsChildEle = setSignedSignatureProps(SIGNING_DATETIME);

  let certificateChildEle = setSigningCertificate();

  certificateChildEle = addSubChildToChild(
    certificateChildEle,
    setCretDigest(CRET_DIGEST.ALGO_REF, CRET_DIGEST.VALUE),
  );

  certificateChildEle = addSubChildToChild(
    certificateChildEle,
    setIssuerSerial(ISSUER.NAME, ISSUER.SERIAL_NUMBER),
  );

  sigPropsChildEle = addSubChildToChild(sigPropsChildEle, certificateChildEle);

  objChildEle = addSubChildToChild(objChildEle, sigPropsChildEle);

  sigChildEle = addSubChildToChild(sigChildEle, objChildEle);

  sigParentEle = addSubChildToChild(sigParentEle, sigChildEle);

  childEle = addSubChildToChild(childEle, sigParentEle);

  const extentionContent = setExtentionContent();
  addNodesToParent(extentionContent, childEle);
  addNodesToParent(parentEle, extentionContent);

  return parentEle;
}

module.exports = {
  UBL_EXTENSION_COMPONENT,
};
