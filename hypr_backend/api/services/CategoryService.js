const { hasDuplicates } = require('../../utils/controller');
const { CATEGORY_TYPE } = require('./Constants');
const { CategoryTypes } = require('../constants/enums');
const camelcaseKeys = require('camelcase-keys');
const CategoryMultilingualAttributeDao = require('../modules/v1/Funnel/CategoryMultilingualAttributeDao');
const { getMaxProductPriority } = require('../modules/v1/Funnel/FunnelService');

async function findAndUpdateSubCategory(parent, subCategories) {
  return new Promise(async (resolve, reject) => {
    try {
      let updatedSubCategories = [];
      let multilingual = [];
      let categoriesToUpdatePriority = [];
      let priorities = [];
      async.eachSeries(
        subCategories,
        async function (cat, cb) {
          try {
            let tempCat = JSON.parse(JSON.stringify(cat));
            let categoryLangugages;
            if (!_.isEmpty(cat["multilingual"])) categoryLangugages = cat["multilingual"];
            delete cat["multilingual"];
            if (cat.id) {
              delete cat.priority;
              var subCat = await Categories.update(
                { id: cat.id, parent: parent.id },
                cat
              );
              if (categoryLangugages) {
                multilingual = [...multilingual, ...categoryLangugages];
              }
              subCat = subCat[0];
              if (subCat.priority != tempCat.priority) {
                categoriesToUpdatePriority.push(subCat);
                priorities.push(tempCat.priority);
              }
            } else {
              cat["parent"] = parent.id;
              cat.type = cat.type === 'BRAND' ? 1 : 0;
              var subCat = await Categories.create(cat);
              if (categoryLangugages) {
                categoryLangugages.forEach(language => language.categoryId = subCat.id);
                multilingual = [...multilingual, ...categoryLangugages];
              }
            }
            updatedSubCategories.push(subCat);
            cb();
          } catch (err) {
            cb(err);
          }
        },
        async function (err, success) {
          if (err) {
            reject(err);
          } else {
            for (
              var index = 0;
              index < categoriesToUpdatePriority.length;
              index++
            ) {
              let subCat = JSON.parse(
                JSON.stringify(categoriesToUpdatePriority[index])
              );
              subCat.priority = priorities[index];
              let response = await CategoryService.findAndUpdateOldPriorityCategories(
                subCat,
                categoriesToUpdatePriority[index],
                parent.id
              );
              if (response.success) {
                let updatedCategory = await Categories.update(
                  { id: subCat.id, parent: parent.id },
                  { priority: subCat.priority }
                );
              } else {
                resolve({
                  success: false,
                  message: response.message,
                  trace: response.trace,
                  type: ErrorTypes.BAD_REQUEST,
                });
              }
            }
            resolve({
              success: true,
              sub_categories: updatedSubCategories,
              multilingual,
            });
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

async function updateCategoryLanguage(categoryLangugages) {
  let languagePromise = [];
  const categoryIds = [...new Set(categoryLangugages.map(language => language.categoryId))]; // Get unique category ids
  const existingCategoryLanguages = await CategoryMultilingualAttributeDao.findAll({ categoryId: categoryIds });
  for (const language of categoryLangugages) {
    const criteria = { categoryId: language.categoryId, language: language.language, attributeName: language.attributeName };
    const languageExists = existingCategoryLanguages.filter(existingLanguage => {
      return (existingLanguage.categoryId == language.categoryId &&
        existingLanguage.language == language.language &&
        existingLanguage.attributeName == language.attributeName);
    });
    if (_.isEmpty(languageExists)) {
      languagePromise.push(CategoryMultilingualAttributeDao.create({ ...criteria, value: language.value }));
    } else {
      if (_.isEmpty(language.value)) {
        languagePromise.push(CategoryMultilingualAttributeDao.remove(criteria));
      } else {
        languagePromise.push(CategoryMultilingualAttributeDao.update(criteria, { value: language.value }));
      }
    }
  }
  await Promise.all(languagePromise);
};

module.exports = {
  updateOldCategoryPriority: async function (OldPriorityCategories, incre) {
    return new Promise(async (resolve) => {
      var updateValue;
      if (OldPriorityCategories && OldPriorityCategories.length > 0) {
        async.eachSeries(
          OldPriorityCategories,
          async function (OldPriorityCategory, callback) {
            if (incre) updateValue = OldPriorityCategory.priority + 1;
            else {
              updateValue = OldPriorityCategory.priority - 1;
            }
            try {
              let updatedPriority = await Categories.update(
                { id: OldPriorityCategory.id },
                {
                  priority: updateValue,
                }
              );
              callback();
            } catch (err) {
              callback(err);
            }
          },
          function (err, success) {
            if (err) {
              reject(err);
            } else {
              resolve({
                success: true,
              });
            }
          }
        );
      } else
        resolve({
          success: true,
        });
    });
  },
  findAndUpdateCategory: async function (category, parent) {
    return new Promise(async (resolve, reject) => {
      try {
        let tobeUpdateCategory = await Categories.findOne({ id: category.id });
        if (tobeUpdateCategory) {
          if (category.priority === tobeUpdateCategory.priority) {
            let subCategories = category["sub_categories"];
            let categoryLangugages = category["multilingual"];
            delete category["sub_categories"];
            delete category["multilingual"];
            let updatedCategory = await Categories.update(
              { id: category.id },
              category
            );
            updatedCategory = updatedCategory[0];
            let response = await findAndUpdateSubCategory(
              updatedCategory,
              subCategories
            );
            if (response.success) {
              categoryLangugages = [...categoryLangugages, ...response.multilingual];
              await updateCategoryLanguage(categoryLangugages);
              resolve({
                success: true,
                updatedCategory: updatedCategory,
              });
            } else {
              resolve(response);
            }
          } else {
            let response = await CategoryService.findAndUpdateOldPriorityCategories(
              category,
              tobeUpdateCategory,
              parent
            );
            if (response.success) {
              let subCategories = category["sub_categories"];
              let categoryLangugages = category["multilingual"];
              delete category[
                "sub_categories"
              ]; /* NOTE: as associations are not accepted as JSON now */
              delete category["multilingual"];
              let updatedCategory = await Categories.update(
                { id: category.id },
                category
              );
              let response = await findAndUpdateSubCategory(
                updatedCategory[0],
                subCategories
              );
              if (response.success) {
                categoryLangugages = [...categoryLangugages, ...response.multilingual];
                await updateCategoryLanguage(categoryLangugages);
                updatedCategory["sub_categories"] = subCategories;
                resolve({
                  success: true,
                  updatedCategory: updatedCategory,
                });
              } else {
                resolve(response);
              }
            }
            resolve(response);
          }
        } else {
          resolve({
            message: "CATEGORY NOT FOUND",
            type: ErrorTypes.BAD_REQUEST,
            success: false,
          });
        }
      } catch (err) {
        reject(err);
      }
    });
  },

  findAndUpdateSubCategoryPriority: async function (category, parent) {
    return await new Promise(async (resolve) => {
      try {
        let tobeUpdateCategory = await Categories.findOne({ id: category.id });
        if (tobeUpdateCategory) {
          let response = await CategoryService.findAndUpdateOldPriorityCategories(
            category,
            tobeUpdateCategory,
            parent
          );
          if (response.success) {
            try {
              let updatedCategory = await Categories.update(
                { id: category.id },
                { priority: category.priority }
              );
              resolve({
                success: true,
              });
            } catch (err) {
              resolve({
                success: false,
                message: "ERROR OCCURED WHILE UPDATING",
                trace: err,
                type: ErrorTypes.BAD_REQUEST,
              });
            }
          } else {
            resolve({
              success: false,
              message: response.message,
              trace: response.trace,
              type: ErrorTypes.BAD_REQUEST,
            });
          }
        } else {
          resolve({
            success: false,
            message: "CATEGORY NOT FOUND",
            trace: "ERROR OCCURED WHILE PROCESSING",
            type: ErrorTypes.BAD_REQUEST,
          });
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  findAndUpdateOldPriorityCategories: async function (
    category,
    tobeUpdateCategory,
    parent
  ) {
    let response = await new Promise(async (resolve) => {
      let mid = parent ? "= " : "is ";
      parent = parent ? parent : null;
      let maxPriorityQuery =
        "SELECT MAX(priority) as maxpriority, MIN(priority) as minpriority from `categories` where parent_id " +
        mid +
        parent +
        " AND location_id = " +
        category.location_id;

      try {
        Categories.query(maxPriorityQuery, async (err, maxPriority) => {
          if (err) return reject(err);
          maxPriority = maxPriority.rows[0];
          if (category.priority > maxPriority.maxpriority) {
            resolve({
              message: "MAX PRIORITY " + maxPriority.maxpriority + " ALLOWED",
              success: false,
              type: ErrorTypes.BAD_REQUEST,
              trace: "CategoryService findAndUpdateOldPriorityCategories",
            });
          } else if (maxPriority.minpriority > category.priority) {
            resolve({
              message: "MIN PRIORITY " + maxPriority.minpriority + " ALLOWED",
              success: false,
              type: ErrorTypes.BAD_REQUEST,
              trace: "CategoryService findAndUpdateOldPriorityCategories",
            });
          } else {
            var whereCondition = {
              parent: parent,
              location_id: category.location_id,
            };
            let inc =
              category.priority > tobeUpdateCategory.priority ? false : true;
            let priorObject =
              category.priority > tobeUpdateCategory.priority
                ? {
                  ">": tobeUpdateCategory.priority || 0,
                  "<=": category.priority || 0,
                }
                : {
                  ">=": category.priority || 0,
                  "<": tobeUpdateCategory.priority || 0,
                };
            whereCondition["priority"] = priorObject;
            whereCondition = { where: whereCondition, sort: "priority asc" };
            let oldPrioritoryCategories = await Categories.find(whereCondition);
            let response = await CategoryService.updateOldCategoryPriority(
              oldPrioritoryCategories,
              inc
            );
            resolve(response);
          }
        });
      } catch (err) {
        reject(err);
      }
    });

    return response;
  },
  getAllCategories: async function (findCriteria, countCriteria) {
    let response = await new Promise(async (resolve) => {
      let totalCount = await Categories.count(countCriteria);
      let categories = await Categories.find(findCriteria)
        .populate("sub_categories")
        .populate("multilingual")
        .sort("priority ASC");
      // .populate("sub_categories", {
      //   sort: "priority ASC",
      // });
      async.eachSeries(
        categories,
        function (category, callback) {
          var cat = _.cloneDeep(category);
          var reduced_category = _.omit(cat, [
            "urdu_name",
            "products",
            "promotion",
          ]);
          var index = categories.indexOf(category);
          categories[index] = reduced_category;
          var subCategories = categories[index].sub_categories;
          async.eachSeries(
            subCategories,
            async function (sub_cat, subCallback) {
              var subCat = _.cloneDeep(sub_cat);
              var reduced_sub_category = _.omit(subCat, [
                "urdu_name",
                "sub_categories",
                "products",
                "promotion",
              ]);
              var index = subCategories.indexOf(sub_cat);
              subCategories[index] = reduced_sub_category;
              const maxPriorityQuery = `select max(product_priority) as max_priority from product_categories_junction where category_id = $1`;
              const multilingualQuery = `select * from category_multilingual_attribute where category_id = $1`;
              const promise = [await sails.sendNativeQuery(maxPriorityQuery, [sub_cat.id]), await sails.sendNativeQuery(multilingualQuery, [sub_cat.id])];
              const [maxPriorityResponse, multilingualResponse] = await Promise.all(promise);
              subCategories[index].maxProductPriority = maxPriorityResponse.rows[0].max_priority;
              subCategories[index].multilingual = camelcaseKeys(multilingualResponse.rows);
              subCallback();
            },
            function (err, result) {
              categories[index].sub_categories = subCategories;
              callback();
            }
          );
        },
        function (err, success) {
          if (err) console.log(err);
          else {
            if (countCriteria.or) delete countCriteria.or;
            console.log("COUNT CRITERIA", countCriteria);
            Categories.count(countCriteria).exec(function (err, count) {
              if (err) {
                resolve({
                  categories: categories,
                  totalCount: totalCount,
                  totalwithoutSearch: 0,
                });
              } else {
                resolve({
                  categories: categories,
                  totalCount: totalCount,
                  totalwithoutSearch: count,
                });
              }
            });
          }
        }
      );
    });

    return response;
  },

  checkDuplicateCategories: async function (params) {
    return new Promise(async (resolve, reject) => {
      try {
        let categoryFound = await Categories.find({
          name: params.name,
          location_id: params.location_id,
          parent: null,
        });
        if (categoryFound.length) {
          throw Error("CATEGORY ALREADY EXISITS");
        }
        if (
          params.hasOwnProperty("sub_categories") &&
          params.sub_categories.length > 0
        ) {
          let subCatNames = params.sub_categories.map(function (subCat) {
            return subCat.name;
          });
          if (hasDuplicates(subCatNames)) {
            throw Error("SUB-CATEGORY REPEATED");
          }
        }
        resolve({ success: true });
      } catch (err) {
        sails.log.error(`ReqID: reqId, UserID: userId, Error in checkDuplicateCategories() -> [${JSON.stringify(err.stack)}]`);
        reject({
          success: false,
          trace: err,
          message: err.message || "ERROR OCCURED AT PROCCESSING CATEGORIES",
          type: ErrorTypes.BAD_REQUEST,
        });
      }
    });
  },

  createCategories: async function (params) {
    return new Promise(async (resolve, reject) => {
      try {
        const categoryObject = {
          name: params.name,
          priority: params.priority,
          start_date: params.start_date,
          end_date: params.end_date,
          image_url: params.image_url,
          location_id: params.location_id,
          type: CategoryTypes[params.type] || CategoryTypes.CATEGORY,
        };
        let productCategory = await Categories.findOrCreate(
          { name: params.name, location_id: params.location_id, parent: null },
          categoryObject,
        );
        let categoryLangugages = [];
        if (!_.isEmpty(params.multilingual)) {
          for (const language of params.multilingual) {
            categoryLangugages.push({ ...language, categoryId: productCategory.id });
          }
        }
        let subCatMultilingual = [];
        if (
          params.hasOwnProperty("sub_categories") &&
          params.sub_categories.length > 0
        ) {
          params.sub_categories = params.sub_categories.map(function (cat) {
            cat["parent"] = productCategory.id;
            cat["type"] = CategoryTypes[params.type] || CategoryTypes.CATEGORY;
            if (!_.isEmpty(cat.multilingual)) {
              for (const language of cat.multilingual) {
                subCatMultilingual.push({ ...language, categoryName: cat.name })
              }
              delete cat.multilingual;
            }
            return cat;
          });

          let subCats = await Promise.all(
            params.sub_categories
              .map(async (category) => {
                let subCategory = await Categories.findOrCreate(
                  {
                    name: category.name,
                    location_id: category.location_id,
                    parent: productCategory.id,
                  },
                  category
                );

                if (subCategory) return subCategory;
              })
              .filter((e) => e)
          );
          productCategory["sub_categories"] = subCats;
        }
        if (!_.isEmpty(subCatMultilingual)) {
          for (const language of subCatMultilingual) {
            const subCat = productCategory["sub_categories"].filter(category => category.name == language.categoryName)[0];
            delete language.categoryName;
            categoryLangugages.push({ ...language, categoryId: subCat.id });
          }
        }
        await updateCategoryLanguage(categoryLangugages);
        resolve();
      } catch (err) {
        sails.log.error(`ReqID: reqId, UserID: userId, Error in createCategories() -> [${JSON.stringify(err.stack)}]`);
        reject({
          success: false,
          trace: err,
          message: err.message || "ERROR OCCURED AT PROCCESSING CATEGORIES",
          type: ErrorTypes.BAD_REQUEST,
        });
      }
    });
  },

  getProductCategories: async function (productId, location_id) {
    let response = await new Promise(async (resolve, reject) => {
      var query_string =
        "SELECT pc.id AS category_id, pc.name AS category_name";
      query_string += " FROM categories AS pc";
      query_string +=
        " INNER JOIN product_categories_junction as pcj ON pcj.category_id = pc.id";
      query_string +=
        " WHERE pc.location_id = " +
        location_id +
        " AND pcj.product_id = " +
        productId;

      console.log("LOCATION - ", location_id, " PRODUCT - ", productId);
      Categories.query(query_string, [], function (error, category_response) {
        var response = {
          status: "OK",
          message: "response",
        };
        if (error) {
          reject({
            success: false,
            message: "Category not found",
            trace: error,
            type: ErrorTypes.BAD_REQUEST,
          });
        } else {
          response.data = category_response.rows[0];
        }
        resolve({
          success: true,
          response: response,
        });
      });
    });
    return response;
  },
  getCategoriesForStore: async (reqID, params) => {
    return new Promise(async (resolve, reject) => {
      try {
        sails.log.info(
          `reqID: ${reqID}, context: CategorySerivce.getCategoriesForStore params: ${JSON.stringify(
            params
          )}`
        );

        let skip = 0;
        let limit = 20;
        if (params.page && params.page > 0) {
          skip = parseInt(params.page - 1) * parseInt(params.per_page);
        }
        if (params.per_page) {
          limit = parseInt(params.per_page) + skip;
        }
        sails.log(`reqID: ${reqID}, context: CategorySerivce.getCategoriesForStore Skip: ${skip} Limit: ${limit}`);

        let paginate = true;
        if (params.avoidPagination) {
          paginate = false;
        }
        let location_id = params.location_id;
        let store = await RedisService.getCategories(reqID, location_id, skip, limit, params.showDisabled, paginate, params.type);
        let count = store.count;
        store = store.store;
        sails.log(`reqID: ${reqID}, context: CategorySerivce.getCategoriesForStore Redis Categories paginated: ${store.length} Total: ${count}`);
        if (store.length == 0) {
          let findCriteria = {
            parent: null,
            location_id: params.location_id,
            type: CategoryTypes[params.type] || CategoryTypes.CATEGORY,
          };
          let countCriteria = { ...findCriteria };
          findCriteria = { where: findCriteria };
          store = await CategoryService.getAllCategories(
            findCriteria,
            countCriteria
          );
          count = store.totalCount;
          store = store.categories;
          sails.log(`reqID: ${reqID}, context: CategorySerivce.getCategoriesForStore DB Categories Total: ${count}`);
          if (store.length > 0) {
            // filter disabled categories if not getAllCategories
            if (!params.showDisabled) {
              store = store.filter(function (category) {
                return category.disabled_at == null;
              });
            }
            // filter disabled subacategories if not getAllCategories and sort by priority
            for (let i = 0; i < store.length; i++) {
              if (!params.showDisabled) {
                store[i].sub_categories = store[i].sub_categories.filter(function (
                  subcategory
                ) {
                  return subcategory.disabled_at == null;
                });

              }
              store[i].sub_categories = store[i].sub_categories.sort(function (a, b) {
                return a.priority - b.priority;
              });

              sails.log(
                `reqID: ${reqID}, context: CategorySerivce.getCategoriesForStore Category: ${store[i].name
                } Sorted Subcategories: ${JSON.stringify(
                  store[i].sub_categories.length
                )}`
              );
            }
            await getMaxProductPriority(store);
            // sort by priority
            store = store.sort(function (a, b) {
              return a.priority - b.priority;
            });
            RedisService.setCategories(reqID, store, params.location_id, params.showDisabled, params.type);
            // paginate
            if (paginate) {
              store = store.slice(skip, limit);
            }
          }
        }
        sails.log.info(
          `reqID: ${reqID}, context: CategorySerivce.getCategoriesForStore Paginated: ${store.length} Total Count: ${count} `
        );
        resolve({ categories: store, totalCount: count, totalwithoutSearch: count });
      } catch (err) {
        sails.log.error(
          `reqID: ${reqID}, context: CategorySerivce.getCategoriesForStore Error: ${JSON.stringify(err.stack)}`
        );
        resolve({ categories: [], count: 0 });
      }
    });
  },
};
