const businessUnitExtractionService = require("../config_service_extraction/businessUnitExtraction");
const companyExtractionService = require("../config_service_extraction/companiesExtraction");

module.exports = {
  getAllBusinessUnits: async findCriteria => new Promise(async (resolve, reject) => {
    try {
      const ibu = await businessUnitExtractionService.find(findCriteria);
      const company = await companyExtractionService.findOne({ id: 4 });
      ibu.forEach(bu => {
        bu.company_id = company;
      });
      resolve(ibu);
    } catch (e) {
      reject(e);
    }
  }),
  getEnabledBuIds: async function (additional_query, query_params) 
  {  
    let query = "SELECT distinct business_units.id as id FROM companies, business_units where business_units.company_id = companies.id and companies.disabled = 0 and business_units.disabled = 0" +
    additional_query;  
    try {    
      let result = await sails.sendNativeQuery(query, query_params);    
      let bus = result.rows;    
      let enabled_bus = [0];
      if (bus.length > 0) {
        bus.forEach((bu) => {
          enabled_bus.push(bu.id);
        });
      }   
      return enabled_bus;   
    } 
    catch (err) {    
      return [0];  
    }
  }
};
