/**
 *
 * @param {Number} tagId 
 */
const findElasticAppSearchSynonymsTagsByTagsId = async (tagId) =>
	await ElasticAppSearchSynonymsTags.findOne({ tag_id: tagId })
/**
 *
 * @param {Number} tagId 
 * @param {String} synonymsId
 */
const addElasticAppSearchSynonymsTags = async (tagId, synonymsId) =>
	await ElasticAppSearchSynonymsTags.create({ tag_id: tagId, synonyms_id: synonymsId });
/**
 *
 * @param {Number[]} tagIds
 */
const findElasticAppSearchSynonymsTagsByTagsIds = async (tagIds) =>
	await ElasticAppSearchSynonymsTags.find({ tag_id: { in: tagIds } })

const deleteElasticAppSearchSynonymsTagsByTagsIds = async (synonymsId) =>
	await ElasticAppSearchSynonymsTags.destroy({ synonyms_id: synonymsId })


module.exports = {
	addElasticAppSearchSynonymsTags,
	findElasticAppSearchSynonymsTagsByTagsIds,
	deleteElasticAppSearchSynonymsTagsByTagsIds,
	findElasticAppSearchSynonymsTagsByTagsId
};
