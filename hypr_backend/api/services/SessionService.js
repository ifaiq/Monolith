module.exports = {

  create: async (context_name, token) => await Sessions.create({context_name: context_name, token: token}),

  updateTokenByContextName: async (context_name, token) => await Sessions.updateOne({context_name: context_name}).set({token: token}),

  getByContextName: async context_name => await Sessions.findOne({context_name: context_name}),
}
