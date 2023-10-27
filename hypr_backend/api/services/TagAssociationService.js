/**
 *
 * @param {Number} tagId 
 * @param {Number} contextId 
 * @param {String} contextName 
 */
const addTagAssociation = async (tagId, contextId, contextName) =>
	await TagAssociation.create({ tag_id: tagId, context_id: contextId, context_name: contextName, });

/**
 * 
 * @param {Number]} tagId 
 * @param {Number} contextId 
 * @param {String} contextName 
 *
 */
const removeTagAssociation = async (tagId, contextId, contextName) =>
	await TagAssociation.update({ tag_id: tagId, context_id: contextId, context_name: contextName }, { disabled: true });

/**
 * 
 * @param {Number]} tagId 
 * @param {Number} contextId 
 * @param {String} contextName 
 *
 */
const updateTagAssociation = async (tagId, contextId, contextName) =>
	await TagAssociation.update({ tag_id: tagId, context_id: contextId, context_name: contextName }, { disabled: false });
/**
 *
 * @param {Number} contextId 
 */
const findTagAssociationByContextId = async contextId =>
	await TagAssociation.find({ context_id: contextId });
/**
 *
 * @param {Number} contextId 
 */
const findTagAssociation = async contextId =>
	await TagAssociation.find({ context_id: contextId, disabled: false });

module.exports = {
	addTagAssociation,
	removeTagAssociation,
	findTagAssociation,
	updateTagAssociation,
	findTagAssociationByContextId
};
