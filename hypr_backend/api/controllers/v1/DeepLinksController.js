const { SCREENS } = require("../../constants/enums");
const { deeplinkEvent } = require("../../modules/v1/DeepLinks/DeeplinkServices");
const uuid4 = require("uuid4");

const redirectingToDeepLinks = async (req, res) => {
  sails.log.info(`DEEP LINK CONTROLLER: params recieved - ${JSON.stringify(req.params)}`);

  const {source, campaign, medium} = req.query;
  const catScreen = req.params.categoryId  &&  SCREENS.CATEGORY;
  const subCatScreen = req.params.subcategoryId && SCREENS.SUBCATEGORY;
  const productScreen = subCatScreen ? subCatScreen : catScreen;
  const screen = productScreen ? productScreen : req.params.screen;
  const categoryId = req.params.categoryId;
  const sessionId = uuid4();
  const subcategoryId = req.params.subcategoryId;

  await deeplinkEvent(sessionId, source, medium, campaign, screen, categoryId, subcategoryId);

  try{
    if (req.params.screen) {
      if (req.params.screen === "products") {
        if (req.params.categoryId) {
          if (req.params.subcategoryId) {
            res.redirect(
              308,
              // eslint-disable-next-line max-len
              `retailo://consumer.retailo.co/${req.params.screen}/${req.params.categoryId}/${req.params.subcategoryId}/${sessionId}`,
            );
          } else {
            // eslint-disable-next-line max-len
            res.redirect(308, `retailo://consumer.retailo.co/${req.params.screen}/${req.params.categoryId}/${sessionId}`);
          }
        } else res.serverError("You did not provide the categoryId.");
      } else res.redirect(308, `retailo://consumer.retailo.co/${req.params.screen}/${sessionId}`);
    } else res.redirect(308, `retailo://consumer.retailo.co/${sessionId}`);
  } catch(error) {
    res.serverError(error);
  }
};

module.exports = {
  redirectingToDeepLinks,
};
