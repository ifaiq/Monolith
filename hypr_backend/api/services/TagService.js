module.exports = {
  get: async (skip, limit) => await Tag.find()
    .skip(skip)
    .limit(limit)
    .sort("created_at DESC"),
  /**
   * 
   * @param {Number[]} ids 
   */
  getByIds: async ids => await Tag.find({ id: { in: ids } }),
  /**
   * 
   * @param {Number} id 
   */
  getById: async id => await Tag.findOne({ id }),
  /**
   * 
   * @param {Object} tag 
   */
  create: async tag => await Tag.create(tag),
  /**
   * 
   * @param {Object[]} tags 
   */
  bulkCreate: async tags => await Tag.createEach(tags),
  /**
   * 
   * @param {Number[]} ids 
   * @param {Object} tag 
   */
  update: async (id, tag) => {
    let tagResponse = await Tag.update({ id }, tag)
    return tagResponse[0];
  },
  /**
   * 
   * @param {string} criteria 
   */
  search: async criteria => await Tag.find({
    name: { contains: criteria }
  }),
  count: async () => await Tag.count(),
};
