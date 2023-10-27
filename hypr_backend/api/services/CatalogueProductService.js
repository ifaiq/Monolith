module.exports = {
    updateCatalogueProducts: async function (id, params) {
        if (id && typeof(x) ==='undefined') {
            try {
                let updatedCatalogue = await CatalogueProducts.update({ id: id }).set(params).fetch();
                return (updatedCatalogue);
            } catch (e) {
                throw e;
            }
        } else {
            throw "invalid params!"
        }
    }

}

