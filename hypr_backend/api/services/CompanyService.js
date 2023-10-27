module.exports = {
  getEnabledCompanyIds: async function (additional_query, query_params) {
    let query =
      "SELECT distinct companies.id as id FROM companies where companies.disabled = 0" +
      additional_query;
    try {
      let result = await sails.sendNativeQuery(query, query_params);
      let companies = result.rows;
      let enabled_companies = [0];
      if (companies.length > 0) {
        companies.forEach((company) => {
          enabled_companies.push(company.id);
        });
      }
      return enabled_companies;
    } catch (err) {
      return [0];
    }
  },
  getCompaniesByAppId: async function (app_id, companyIds) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        let query =
          "SELECT distinct companies.* FROM companies inner join app_versions where "+
          "app_versions.company_id = companies.id and companies.disabled = 0 "
          "and app_versions.id = $1 ";
        if (companyIds.length > 0) {
          query += " and companies.id in (" + companyIds + ")";
        }
        let query_result = await sails.sendNativeQuery(query, [app_id]);
        let companies = query_result.rows;
        resolve({
          success: true,
          companies: companies,
        });
      } catch (e) {
        reject({
          success: false,
          error: e,
        });
      }
    });
    return response;
  },
};
