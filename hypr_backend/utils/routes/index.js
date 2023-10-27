module.exports = {
    addPrefixWithRoutes: (prefix, routes) => {
        let prefixRoutes = {};
        for (let [key, value] of Object.entries(routes)) {
            key = key.slice(0, key.indexOf('/')) + prefix + key.slice(key.indexOf('/'));
            prefixRoutes[key] = value
        }
        return prefixRoutes
    },
};
