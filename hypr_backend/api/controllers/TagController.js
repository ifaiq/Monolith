const utilsServices = require('../../utils/services/index');

module.exports = {
  getTags: async (req, res) => {
    let meta = {
      userData: res.locals.userData || 'N/A',
      caller: "TagController.getTags()"
    };
    try {
      let logIdentifier = `UserID: ${meta.userData.id}, context: ${req.url},`;
      sails.log.info(`${logIdentifier} In ${meta.caller}`);
      let { skip, limit } = utilsServices.getPagination(req.query.page, req.query.per_page);
      let tags = await TagService.get(skip, limit);
      let count = await TagService.count();
      sails.log(`${logIdentifier} Responding with Tags -> ${JSON.stringify(tags)}`);
      res.ok({ tags, count });
    } catch (err) {
      sails.log.error(`UserID: ${res.locals.userData.id}, context: ${req.url}, Error in ${meta.caller} -> ${JSON.stringify(err.stack || err)}`);
      res.error(err);
    }
  },
  getTagById: async (req, res) => {
    const { params, params: { id } } = req;
    let meta = {
      reqId: id,
      userData: res.locals.userData || 'N/A',
      caller: "TagController.getTagById()"
    };
    try {
      let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${req.url},`;
      sails.log.info(`${logIdentifier} In ${meta.caller}`);
      sails.log(`${logIdentifier} called with params -> ${JSON.stringify(params)}`);

      let tag = await TagService.getById(id);
      // TODO create constants for tag e.g constants/controller/tag
      if (!tag) res.badRequest("Tag not found", { code: 'E_NOT_FOUND' });
      sails.log(`${logIdentifier} Responding with Tag -> ${JSON.stringify(tag)}`);
      res.ok(tag);
    } catch (err) {
      sails.log.error(`ReqID: ${meta.reqId}, UserID: ${res.locals.userData.id}, context: ${req.url}, Error in ${meta.caller} -> ${JSON.stringify(err.stack || err)}`);
      res.error(err);
    }
  },
  createTag: async (req, res) => {
    let meta = {
      userData: res.locals.userData || 'N/A',
      caller: "TagController.createTag()"
    };
    try {
      let { body: { name } } = req;
      let logIdentifier = `UserID: ${meta.userData.id}, context: ${req.url},`;
      sails.log.info(`${logIdentifier} In ${meta.caller}`);
      name = name.toLowerCase();
      let tag = await TagService.create({ name });
      sails.log(`${logIdentifier} Responding with Tag -> ${JSON.stringify(tag)}`);
      res.ok(tag);
    } catch (err) {
      sails.log.error(`UserID: ${res.locals.userData.id}, context: ${req.url}, Error in ${meta.caller} -> ${JSON.stringify(err.stack || err)}`);
      let { code, message } = err;
      if (code === 'E_UNIQUE') {
        res.badRequest(message, { code: 'E_UNIQUE' })
      }
      res.error(err);
    }
  },
  updateTag: async (req, res) => {
    // TODO Add Joi validation.
    let { body: { name } } = req;
    const { params, params: { id } } = req;
    let meta = {
      reqId: id,
      userData: res.locals.userData || 'N/A',
      caller: "TagController.updateTag()"
    };
    try {
      let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${req.url},`;
      sails.log.info(`${logIdentifier} In ${meta.caller}`);
      sails.log(`${logIdentifier} called with params -> ${JSON.stringify(params)}`);
      let tag = await TagService.getById(id);
      name = name.toLowerCase();
      let updatedTag = await TagService.update(id, { name });
      let synonymsTag = await ElasticAppSearchSynonymsTagsService.findElasticAppSearchSynonymsTagsByTagsId(id);
      if (synonymsTag) {
        let { synonyms } = await ElasticSearchService.getSynonymsById(synonymsTag.synonyms_id);
        var index = synonyms.indexOf(tag.name);
        if (index !== -1) {
          synonyms[index] = name;
          await ElasticSearchService.updateSynonyms(synonymsTag.synonyms_id, synonyms);
        }
      }
      // TODO create constants for tag e.g constants/controller/tag
      if (!updatedTag) res.badRequest("Tag not found", { code: 'E_NOT_FOUND' })
      sails.log(`${logIdentifier} Responding with Updated Tag -> ${JSON.stringify(updatedTag)}`);
      res.ok(updatedTag);
    } catch (err) {
      sails.log.error(`ReqID: ${id}, UserID: ${res.locals.userData.id}, context: ${req.url}, Error in ${meta.caller} -> ${JSON.stringify(err.stack || err)}`);
      let { code, message } = err;
      if (code === 'E_UNIQUE') {
        res.badRequest(message, { code: 'E_UNIQUE' })
      }
      res.error(err);
    }
  },
  searchTag: async (req, res) => {
    let meta = {
      userData: res.locals.userData || 'N/A',
      caller: "TagController.searchTag()"
    };
    try {
      let logIdentifier = `UserID: ${meta.userData.id}, context: ${req.url},`;
      sails.log.info(`${logIdentifier} In ${meta.caller}`);
      const { query: { tag } } = req;
      let searchedTag = await TagService.search(tag);
      sails.log(`${logIdentifier} Responding with Tag -> ${JSON.stringify(searchedTag)}`);
      res.ok(searchedTag);
    } catch (err) {
      sails.log.error(`UserID: ${res.locals.userData.id}, context: ${req.url}, Error in ${meta.caller} -> ${JSON.stringify(err.stack || err)}`);
      res.error(err);
    }
  },
};
