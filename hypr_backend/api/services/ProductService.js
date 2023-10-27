var defer = require("node-defer");
var elasticSeachClient = require("./ElasticSearchService");
const http = require("axios");
const uuid4 = require("uuid4");
const S3Service = require("../services/S3Service");
const AWSService = require("./AWSService");
const AWS = AWSService.getAWSConfig();
const OdooService = require("../services/OdooService");
const csv = require("fast-csv");
const s3 = new AWS.S3();
const { HyprRoles: { COMPANY_OWNER, ADMIN } } = require('../services/Constants')
const ProductMultilingualAttributeDao = require('../modules/v1/Product/ProductMultilingualAttributeDao');
const {
  findVolumeBasedProductPrices,
  createVolumeBasedProductPrices,
  deleteVolumeBasedProductPrices,
} = require("../modules/v1/Product/ProductService");

const { validateVolumeBasedProducts } = require("../modules/v1/Product/ProductValidator");
const locationExtractionService = require("../config_service_extraction/locationsExtraction");
const { countInArray } = require("../../utils/csv-helpers");
const { removeWhiteSpace } = require('../../utils/removeSpaces');
const { skuDeactivationReasonJunctionService } = require('../modules/v1/SkuDeactivationReasonJunction');

module.exports = {
  /* params = {
    new_product_data,
    old_product,
    user_id,
    source
  }*/
  updateProductWithHistory: async function (params, role = null, locationId = null) {
    let defered = new defer();
    try {
      let newVolumeBasedPrices = params.new_product_data.volume_based_prices;
      const oldVolumeBasedPrices = await findVolumeBasedProductPrices({
        where: { productId: params.old_product.id },
      });   
      if(params.new_product_data.is_volume_based_price_enabled){
        if (!params.csv_vbp) {
          validateVolumeBasedProducts(
            params.new_product_data.volume_based_prices);

          params.new_product_data.volume_based_prices.map(vbp => (vbp.productId = params.old_product.id));
          newVolumeBasedPrices= params.new_product_data.volume_based_prices;

        }else if (params.csv_vbp){
          let isValid = true;
          for (const pItem of newVolumeBasedPrices) {
              if (!pItem.price) {
                isValid = false;
                break;
              }
          }

          if (!isValid || newVolumeBasedPrices.length < 2 || params.new_product_data.price != newVolumeBasedPrices[0].price) {
            return
          }
          if(!oldVolumeBasedPrices.length || oldVolumeBasedPrices.length != newVolumeBasedPrices.length){
            validateVolumeBasedProducts(
              params.new_product_data.volume_based_prices);
  
            params.new_product_data.volume_based_prices.map(vbp => (vbp.productId = params.old_product.id));
            newVolumeBasedPrices= params.new_product_data.volume_based_prices;  
          }
          if(oldVolumeBasedPrices.length === newVolumeBasedPrices.length){
            let i=0;      
              newVolumeBasedPrices = oldVolumeBasedPrices.map(vbp => {
                const newQuantityTo = newVolumeBasedPrices[i].quantityTo;
                return {...vbp, price: newVolumeBasedPrices[i].price, quantityFrom: newVolumeBasedPrices[i++].quantityFrom,
                   ...((newQuantityTo !== "") && { quantityTo: newQuantityTo })};
              })    
          }
        }
      }

      if(params.new_product_data.is_volume_based_price_enabled ){
        await deleteVolumeBasedProductPrices(params.old_product.id);
        await createVolumeBasedProductPrices(newVolumeBasedPrices.map(tier => ({...tier, disabled: false})));
      
        sails.log.info(
          `Created volume based products ${JSON.stringify(
            newVolumeBasedPrices,
          )}`,
        );
      }

      delete params.new_product_data.volume_based_prices;
      let old_product = params.old_product;
      let update_prod = params.new_product_data;
      
      if(update_prod['sku']){
        update_prod['sku'] = removeWhiteSpace(update_prod['sku']);
      }
      
      const isUserAllowed = role === ADMIN;
      // checks location and role of user and gives access accordingly to update the inventory
      const updateStock = locationId && isUserAllowed;
      if (!updateStock) delete update_prod.stock_quantity;
      let newTagIds = [];
      let { tags, removed_tags } = update_prod;
      if (tags && tags.length) {
        // TODO Logging is not consistent. In Future we need to follow same pattern for logging.
        sails.log.info(`context: ProductService.updateProductWithHistory(), About to create new tags: ${tags}`);
        let newTags = tags.map(tag => tag.new_tag && tag).filter(tag => tag);
        newTags = await createNewTags(newTags);
        newTagIds = newTags.map(newTag => ({ id: newTag.id }));
      }
      if (removed_tags && removed_tags.length) {
        sails.log.info(`context: ProductService.updateProductWithHistory(), About to remove tag associations removed_tags ids: ${removed_tags}`);
        await removeProductTagAssociation(removed_tags, old_product.id);
        await deleteProductTagSynonyms(removed_tags, old_product.id.toString());
      }
      tags = tags && newTagIds ? [...tags, ...newTagIds] : [];
      if (tags.length) {
        sails.log.info(`context: ProductService.updateProductWithHistory(), About to create Product tag Association: ${tags}`);
        await productTagAssociation(tags, old_product.id);
        await elasticAppSearchSynonyms(tags, old_product.id.toString());
      }
      Product.update({ id: old_product.id }, update_prod)
        .then(async function (updated_product) {
          let history_data = {
            product_id: old_product.id,
            old_JSON: old_product,
            new_JSON: params.new_product_data,
            source: params.source,
            updated_by: params.user_id,
            reason: params.reason,
          };
          if(params.new_product_data.is_volume_based_price_enabled ){
            history_data.old_JSON.volume_based_prices = oldVolumeBasedPrices;
            history_data.new_JSON.volume_based_prices = newVolumeBasedPrices ;
          }
          history_data.old_JSON = JSON.stringify(history_data.old_JSON);
          history_data.new_JSON = JSON.stringify(history_data.new_JSON);

          if (params.categoriesToEdit && params.isCategoryEdit) {
            await ProductService.updateProductJunctionRow(
              product.id,
              params.location_id,
              params.categoriesToEdit
            );
          }
          /* NOTE: UPDATE CATEGORIES */
          if (params.category_names) {
            let totalCount = await Categories.count({
              location_id: params.location_id,
              parent: null,
            });
            totalCount = totalCount + 1;
            let multipleCategories = params.category_names.split(";");
            var categoryIds = [];
            for (let categories of multipleCategories) {
              var categoryNames = categories.split("-");
              var parentId = null;
              for (let catName of categoryNames) {
                try {
                  if (!categoryNames.indexOf(catName)) {
                    var category = await Categories.find({
                      name: catName.trim(),
                      location_id: params.location_id,
                      parent: null,
                    }).limit(1);
                    if (category && category.length > 0) {
                      category = category[0];
                      parentId = category.id;
                      categoryIds.push(category.id);
                    } else {
                      console.log("CREATING CATEGORYYYYY " + catName);
                      var categoryCreate = await Categories.create({
                        name: catName.trim(),
                        location_id: params.location_id,
                        start_date: new Date(),
                        end_date: new Date(),
                        priority: totalCount,
                      });
                      parentId = categoryCreate.id;
                      categoryIds.push(categoryCreate.id);
                      totalCount = totalCount + 1;
                    }
                  } else {
                    let critera = {
                      name: catName.trim(),
                      location_id: params.location_id,
                      parent: parentId,
                    };
                    let subCount = await Categories.count({
                      location_id: params.location_id,
                      parent: parentId,
                    });
                    subCount = subCount + 1;
                    var category = await Categories.find(critera).limit(1);
                    if (category && category.length > 0) {
                      category = category[0];
                      categoryIds.push(category.id);
                    } else {
                      console.log(
                        "CREATING CATEGORYYYYY " +
                        catName +
                        " with parent id " +
                        parentId
                      );
                      var categoryCreate = await Categories.create({
                        name: catName.trim(),
                        location_id: params.location_id,
                        start_date: new Date(),
                        end_date: new Date(),
                        parent: parentId,
                        priority: subCount,
                      });
                      categoryIds.push(categoryCreate.id);
                    }
                  }
                } catch (err) {
                  defered.reject(err);
                }
              }
            }
            var catIds = [];
            categoryIds.forEach((ID) => {
              catIds.push({ category_id: ID });
            });
            await ProductService.updateProductJunctionRow(
              updated_product[0].id,
              params.location_id,
              catIds
            );
          }
          /**
           * sending updatedProduct as it is, as we don't need to send location details with update
           */
          OdooService.syncProductData(updated_product[0], true);
          await ProductAuditHistory.create(history_data);
          defered.resolve(updated_product);
        })
        .catch(function (err) {
          defered.reject(err);
        });
    } catch (err) {
      defered.reject(err);
    }
    return defered;
  },
  searchFromEs: async function (query, location, page, size, fetchNonJitItems) {
    let response = await new Promise((resolve) => {
      var pageSize = 20;
      var currentPage = 1;
      if (page) currentPage = page;

      if (size) pageSize = size;

      const option = {
        filters: {
          all: [
            { location_id: location },
            { disabled: "false" },
          ],
        },
        page: {
          size: +pageSize,
          current: +currentPage,
        },
      };
      if (fetchNonJitItems) {
        option.filters.all.push({
          delivery_time: "NULL",
        });
      }

      elasticSeachClient
        .searchData(query, option)
        .then((response) => {
          resolve({
            success: true,
            response: response,
          });
        })
        .catch((err) => {
          console.log(`error occurred on elastic search: ${JSON.stringify(err)}`)
          resolve({
            success: false,
            trace: err,
            message: `SEARCH FROM ES ERROR ${JSON.stringify(err.errorMessages)}`,
            type: ErrorTypes.SERVER_ERROR,
          });
        });
    });

    return response;
  },

  updateProductInEs: async function (pid) {
    let response = await new Promise(async (resolve) => {
      try {
        if (pid) {
          let product = await Product.findOne({ id: pid }).populate("multilingual").populate("volume_based_prices");
          for (const { language, attributeName, value } of product.multilingual) {
            product[(language + '_' + attributeName).toLowerCase().replace(/\s/g, '')] = value;
          }
          if (!product.delivery_time) {
            product.delivery_time = "NULL";
          }
          delete product.multilingual;
          const productDeactiveReason = await skuDeactivationReasonJunctionService.findLatestReasonOfProduct(pid);
          if(productDeactiveReason.length > 0){
            product.is_deactivated = productDeactiveReason[0]?.is_deactivated;
            product.reason = productDeactiveReason[0]?.reason;
          }
          /**
            * In elastic app, search id is a required field and locked by the elastic app search engine
            * We have created synonyms having tag and product ids in elastic app search and we are unab
            * le to search synonyms into the elastic app search due to locking conditions.For this purp
            * ose,we created `elastic_app_search_id` which is the product id, and help elastic search s
            * ynonyms search.elastic_app_search_id is not helping us in creating updating or onboarding
            * of the product and it is separate from the business logic layer.
          */
          product.elastic_app_search_id = product.id;
          elasticSeachClient
            .addData(product)
            .then((response) => {
              resolve({
                success: true,
              });
            })
            .catch((err) => {
              resolve({
                message: "ERROR OCCURRED WHILE ADDING PRODUCT IN ES",
                trace: err,
                type: ErrorTypes.SERVER_ERROR,
                success: false,
              });
            });
        } else {
          resolve({
            message:
              "ERROR OCCURRED WHILE FINDING PRODUCT FUNCTION: UPDATE PRODUCT IN ES",
            trace: "PRODUCT NOT FOUND",
            type: ErrorTypes.SERVER_ERROR,
            success: false,
          });
        }
      } catch (err) {
        resolve({
          message:
            "ERROR OCCURRED WHILE FINDING PRODUCT FUNCTION: UPDATE PRODUCT IN ES",
          trace: err,
          type: ErrorTypes.SERVER_ERROR,
          success: false,
        });
      }
    });

    return response;
  },

  /* NOTE: UTILITY CONTROLLER */
  fetchAndAddToEs: function (loc) {
    return new Promise(async (resolve, reject) => {
      var productToFind = { disabled: false };
      productToFind.location_id = loc;
      let count = await Product.count(productToFind);
      productToFind = { where: productToFind };
      Product.find(productToFind).exec(function (err, products) {
        if (err) {
          reject(err);
        }
        // marking delivery time as string null for ES
        products = products.map((prod) => {
          if (!prod.delivery_time) {
            prod.delivery_time = "NULL"
          }
          return prod;
        });
        var index = 0;
        var arrayLength = products.length;
        var tempArray = [];
        var chunk_size = 100;
        for (index = 0; index < arrayLength; index += chunk_size) {
          myChunk = products.slice(index, index + chunk_size);
          tempArray.push(myChunk);
        }

        console.log("TOTAL CHUNKS OF (100)", tempArray.length);
        let i = 1;
        for (let temp of tempArray) {
          elasticSeachClient
            .addData(temp)
            .then((response) => {
              console.log("PRODUCTS ADDED - ", "Count -", i);
              i++;
            })
            .catch((error) => {
              console.log("PRODUCTS NOT ADDED - ", "Count -", i);
              i++;
            });

          resolve("DONE");
        }
      });
    });
  },

  createProductJunctionRow: async function (
    product_id,
    category_id,
    product_priority = null
  ) {
    const logIdentifier = `Version: Legacy, Context: ProductService.createProductJunctionRow called with params -> product_id: ${product_id}, category_id: ${category_id}, product_priority: ${product_priority},`;

    try {
      return new Promise(async (resolve, reject) => {

        // Process priority in case it is not null, will be null for L1 categories, or if not supplied properly
        if (product_priority != null) {
          // getting max priority for this category
          let maxPriorityQuery = `select max(product_priority) from product_categories_junction where category_id = $1;`;
          let response = await sails.sendNativeQuery(maxPriorityQuery, [category_id]);
          let maxProductPriority = response.rows[0]['max(product_priority)'];

          // in case of 'maxPriority' supplied as priority, else adjust others if needed
          if (product_priority === 'maxPriority') {
            // if supplied priority is 'maxPriority', e.g. in the case of bulk onboarding, max priority is assigned
            sails.log(`${logIdentifier} product_priority supplied is 0, setting it one above the maxPriority in this category`);
            product_priority = maxProductPriority + 1;

          } else {
            if (maxProductPriority != null) {
              // if new priority is less than or equal to max priority, we need adjustments
              if (product_priority <= maxProductPriority) {
                let products = await ProductCategoriesJunction.find(
                  { category_id: category_id }
                );
                for (const product of products) {
                  if (product.product_priority != null) {
                    if (product.product_priority >= product_priority) {
                      await ProductCategoriesJunction.updateOne(
                        {
                          product_id: product.product_id,
                          category_id: product.category_id,
                        }
                      ).set({ product_priority: (product.product_priority + 1) })
                    }
                  }
                }
              } else if (product_priority > (maxProductPriority + 1)) { // or if it is more than one above the current maxPriority, normalize it
                sails.log.warn(`${logIdentifier} product_priority supplied was more than one above the maxPriority in this category`);
                product_priority = maxProductPriority + 1;
              }
            } else {
              product_priority = 1;
            }
          }
        }

        ProductCategoriesJunction.findOrCreate(
          {
            product_id: product_id,
            category_id: category_id,
          },
          {
            product_id: product_id,
            category_id: category_id,
            product_priority: product_priority
          }
        ).exec(function (err, junction, wasCreated) {
          if (!err && wasCreated) {
            resolve("product_categories_junction, record created");
          } else if (!err && !wasCreated) {
            sails.log.warn(`${logIdentifier} Junction was not created, product with this category already exists in the junction table`);            
            resolve("Junction was not created, product with this category already exists");
          } else if (err) {
            sails.log.error(`${logIdentifier} Error while creating junction row via the ORM -> ${JSON.stringify(err.stack)}`);
            reject(err);
          }
        });
      });
    } catch (err) {
      sails.log.error(`${logIdentifier} Error in createProductJunctionRow() -> ${JSON.stringify(err.stack || err)}`);
    }
  },


  deleteProductJunctionRows: async function (categoriesToRemove) {
    return new Promise(async (resolve, reject) => {
      try {
        sails.log.info(`In deleteProductJunctionRows()`);
        sails.log.info(`Called with params -> categoriesToRemove: ${JSON.stringify(categoriesToRemove)}`);
        for (const cat of categoriesToRemove) {
          let products = await ProductCategoriesJunction.find(
            { category_id: cat.category_id }
          );
          for (const product of products) {
            if (product.product_priority != null && cat.product_priority != null) {
              if (product.product_priority > cat.product_priority) {
                sails.log(`Updating priority for junction -> ${JSON.stringify(product)}`);
                let updateResponse = await ProductCategoriesJunction.updateOne(
                  {
                    product_id: product.product_id,
                    category_id: product.category_id,
                  }
                ).set({ product_priority: (product.product_priority - 1) });
                sails.log(`Priority update response -> ${JSON.stringify(updateResponse)}`);

              }
            }
          }
          sails.log(`Deleting junction -> ${JSON.stringify(cat)}`);
          let deleteResponse = await ProductCategoriesJunction.destroy(cat.id);
          sails.log(`Delete junction response -> ${JSON.stringify(deleteResponse)}`);
        }
        resolve();

      } catch (err) {
        sails.log.error(`Error in deleteProductJunctionRow() -> ${JSON.stringify(err.stack)}`);
        reject(err);
      }

    });

  },

  differenceOfJunctionRowsBasedOnCategoryId: function (
    categories_array_1,
    categories_array_2,
    isDestroy
  ) {
    var diff = [];
    categories_array_1.forEach((item) => {
      var index = categories_array_2
        .map((e) => e.category_id)
        .indexOf(item.category_id);
      if (index == -1) {
        diff.push(item);
      }
    });
    return diff;
  },

  commonJunctionRowsCategories: function (
    incomingCategories,
    existingCategories
  ) {
    return new Promise((resolve, reject) => {
      try {
        sails.log(`In commonJunctionRowsCategories(), with params -> incoming: ${JSON.stringify(incomingCategories)}, existing: ${JSON.stringify(existingCategories)}`);
        let commonCategories = [];
        existingCategories = existingCategories.map((e) => e.category_id);
        for (const cat of incomingCategories) {
          if (existingCategories.includes(cat.category_id)) {
            commonCategories.push(cat);
          }
        }
        sails.log(`resolving with common categories -> ${JSON.stringify(commonCategories)}`);
        resolve(commonCategories);
      } catch (err) {
        sails.log.error(`Error in commonJunctionRowsCategories() -> ${JSON.stringify(err.stack)}`);
        reject(err);
      }
    })
  },

  updateProductsPriority: function (
    productId,
    junctionsToUpdate
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        sails.log.info(`In updateProductsPriority()`);
        sails.log.info(`called with params -> productId: ${productId}, junctionsToUpdate; ${JSON.stringify(junctionsToUpdate)}`);
        // iterating over all the categories provided
        for (const junction of junctionsToUpdate) {
          sails.log(`Iterating over junction -> ${JSON.stringify(junction)}`);
          // if its an L2 category, L1 categories donot have priority supplied in them
          if (junction.priority) {
            sails.log(`updating priority, category_id: ${junction.category_id}, product_id: ${productId}`);
            // fetching all the products with in this subcategory from the junction table
            let products = await ProductCategoriesJunction.find(
              { category_id: junction.category_id }
            );
            // getting the current/old priority of the product we are updating
            let oldPriority = products.find((e) => e.product_id == productId).product_priority;
            let maxPriority = products.length;
            let newPriority = junction.priority > maxPriority ? maxPriority : junction.priority;
            sails.log(`Products fetched: "${JSON.stringify(products)}",   newPriority: "${newPriority}",   oldPriority: "${oldPriority}",   maxPriority: "${maxPriority}"`);
            let availablePriorities = Array.from({ length: maxPriority }, (_, i) => i + 1)
            if (!oldPriority) {
              for (const product of products) {
                const index = availablePriorities.indexOf(product.product_priority)
                if (index > -1) {
                  availablePriorities.splice(index, 1);
                }
              }
              if (!_.isEmpty(availablePriorities)) oldPriority = availablePriorities[0];
            }
            if (newPriority != oldPriority) {
              // iterating over all the products in this subcategory
              for (const product of products) {
                sails.log(`Iterating over product -> "${JSON.stringify(product)}"`);
                // checking if its not a L1 category, just in case L1 categories are also passed with priority field or we have some zombie product priorities lying around
                if (product.product_priority != null) {
                  sails.log("priority not null !!");
                  // priority adjustment logic
                  if (newPriority > oldPriority) {
                    sails.log("newPriority > oldPriority   block");
                    if (product.product_priority > oldPriority && product.product_priority <= newPriority) {
                      sails.log("product.product_priority > oldPriority && product.product_priority <= newPriority   block");
                      let updateRes = await ProductCategoriesJunction.updateOne(
                        {
                          product_id: product.product_id,
                          category_id: product.category_id,
                        }
                      ).set({ product_priority: (product.product_priority - 1) });
                      sails.log(`update response: "${JSON.stringify(updateRes)}"`);
                    }
                  } else if (newPriority < oldPriority) {
                    sails.log("newPriority < oldPriority   block");
                    if (product.product_priority < oldPriority && product.product_priority >= newPriority) {
                      sails.log("product.product_priority < oldPriority && product.product_priority >= newPriority   block");
                      let updateRes = await ProductCategoriesJunction.updateOne(
                        {
                          product_id: product.product_id,
                          category_id: product.category_id,
                        }
                      ).set({ product_priority: (product.product_priority + 1) });
                      sails.log(`update response: "${JSON.stringify(updateRes)}"`);
                    }
                  }

                }

              }

              sails.log("setting the new priority");
              // setting the new priority
              let updateRes = await ProductCategoriesJunction.updateOne(
                {
                  product_id: productId,
                  category_id: junction.category_id,
                }
              ).set({ product_priority: newPriority });
              sails.log(`update response: "${JSON.stringify(updateRes)}"`);

            } else {
              sails.log(`This product is already at the same priority, junction -> ${JSON.stringify(junction)}`);
            }

          } else {
            sails.log(`no priority found for this entry, must be a L1 category. category_id: ${junction.category_id}`);
          }

        }

        // after successful priority updation
        sails.log.info(`reqId: reqId, userId: userId, context: this.caller, Leaving updateProductsPriority()`);
        sails.log(`resolving with -> "Records updated successfully"`)
        resolve("Records updated successfully");

      } catch (err) {
        sails.log.error(`reqId: reqId, userId: userId, context: this.caller, Error in updateProductsPriority() -> ${JSON.stringify(err.stack)}`);
        reject(err);
      }
    })
  },

  updateProductJunctionRow: function (
    product_id,
    location_id,
    incoming_categories
  ) {
    return new Promise((resolve, reject) => {
      try {
        sails.log.info(`In updateProductJunction()`);
        sails.log(`called with params -> productId: ${product_id}, incoming_categories: ${JSON.stringify(incoming_categories)}`);
        ProductCategoriesJunction.find({
          product_id: product_id,
        }).exec(async function (err, categories) {
          if (!err) {
            var categoriesToRemove = ProductService.differenceOfJunctionRowsBasedOnCategoryId(
              categories,
              incoming_categories,
              true
            );
            sails.log(`categoriesToRemove: ${JSON.stringify(categoriesToRemove)}`);
            var categoriesToAdd = ProductService.differenceOfJunctionRowsBasedOnCategoryId(
              incoming_categories,
              categories,
              false
            );
            sails.log(`categoriesToAdd: ${JSON.stringify(categoriesToAdd)}`);
            let commonCategories = await ProductService.commonJunctionRowsCategories(
              incoming_categories,
              categories
            );
            sails.log(`commonCategories: ${JSON.stringify(commonCategories)}`);
            await ProductService.deleteProductJunctionRows(categoriesToRemove);
            for (const cat of categoriesToAdd) {
              await ProductService.createProductJunctionRow(
                product_id,
                cat.category_id,
                cat.priority || null
              );
            }
            await ProductService.updateProductsPriority(product_id, commonCategories);
            resolve();
          } else {
            sails.log.error(`Error while getting products in updateProductJunctionRow() -> ${JSON.stringify(err.stack)}`);
            reject();
          }
        });
      } catch (err) {
        sails.log.error(`Error in updateProductJunctionRow() -> ${JSON.stringify(err.stack)}`);
        reject();
      }
    });
  },

  updateProductJunctionRows: async function (data) {
    for (const datum of data) {
      const isPriorityMaxInvalid = await ProductService.isPriorityGreaterThanMaxPriority(datum.categoryId, datum.priority);
      if (isPriorityMaxInvalid.failure) {
        /**
         * Max priority cannot be greater than the total number of products in a category
         */
        throw new Error(`Error Message: Display Priority number assigned is higher than the total number of SKUs ${isPriorityMaxInvalid.maxPriority} in Category ${datum.categoryId}.`)
      }
    }
    /**
     * Swap logic goes here
     */
    let counter = 0;
    for (const datum of data) {
        const swapObjects = await ProductService.getUpdatePriorityObjects(datum);
        /**
         * If the products and categories do not exist
         */
        if(!swapObjects){
          throw new Error(`Error Message: Products and categories do not exist`)
        }
        for(const item of swapObjects){
          await ProductCategoriesJunction
          .update({ category_id: item.category_id, product_id: item.product_id})
          .set({ product_priority: item.product_priority})
          counter++;
        }
    }
    
    return counter; 

  },

  getUpdatePriorityObjects: async function({productId, categoryId, priority}){
    /**
     * Element that is on the desired priority
     */
      const existingPriorityElement = await ProductCategoriesJunction.findOne({
        category_id: categoryId,
        product_priority: priority,
        product_id: { '!=': productId}
      })

      /**
       * Element that we want to update
       */
      const existingUpdateElement = await ProductCategoriesJunction.findOne({
        product_id: productId,
        category_id: categoryId
      });

      /**
       * If no element exist is on the provided priority, just push the incomming element
       */
      if(!existingPriorityElement && existingUpdateElement){
        return [{
          product_id: existingUpdateElement.product_id,
          category_id: existingUpdateElement.category_id,
          product_priority: priority
        }]
      }
      /**
       * If an element exist on the provided priority, swap the priorities with new element
       */
      if(existingPriorityElement && existingUpdateElement){
        return [{
          product_id: existingUpdateElement.product_id,
          category_id: existingUpdateElement.category_id,
          product_priority: existingPriorityElement.product_priority
        }, {
          product_id: existingPriorityElement.product_id,
          category_id: existingPriorityElement.category_id,
          product_priority: existingUpdateElement.product_priority
        }]
      }
      /**
       * If the no element exist then return null
       */
      return null;
  
  },

  isDuplicatePriorityData: (data) => {
    const logIdentifier = `API version: v0, Context: ProductService.isDuplicatePriorityData()`;
    const uniqueCombination = new Set(data.map(datum => `${datum[Object.keys(datum)[0]]}, ${datum[Object.keys(datum)[2]]}, ${datum[Object.keys(datum)[3]]}, ${datum[Object.keys(datum)[4]]}, ${datum[Object.keys(datum)[5]]}`));
    sails.log.info(`${logIdentifier}, Unique Combinations: ${uniqueCombination.size} and Total Size:${data.length} `)
    if (uniqueCombination.size < data.length) {
      return true;
    }

    return false
  },

  isDuplicatePriorityInSameCategory: async (data) => {
    const combinations = data.map(datum => `${datum.productId}-${datum.categoryId}-${datum.type}`);
    for(combination of combinations){
      const count  =  countInArray(combinations, combination);
      if(count > 1){
        return {
          failure: true,
          categoryId: combination.split('-')[1],
          productId: combination.split('-')[0],
          type: combination.split('-')[2]
        };
      }
    }
    return false;
  },

  isPriorityGreaterThanMaxPriority: async function (categoryId, priority) {
    const queryMaxDisplayPriority = 'select COUNT(distinct product_id) totalProducts from  product_categories_junction where category_id=$1';
    const response = await sails.sendNativeQuery(queryMaxDisplayPriority, [categoryId])
    if (priority > response?.rows[0]?.totalProducts) {
      return {
        failure: true,
        maxPriority: response?.rows[0]?.totalProducts
      };
    }
    return {
      failure: false
    };
  },

  transformPriorityData: function (data){
    const transformedData = data.flatMap((datum) => [{
        productId: datum[Object.keys(datum)[0]],
        categoryId: datum[Object.keys(datum)[2]],
        priority: datum[Object.keys(datum)[4]],
        type: 'category'
    }, {
        productId: datum[Object.keys(datum)[0]],
        categoryId: datum[Object.keys(datum)[3]],
        priority: datum[Object.keys(datum)[5]],
        type: 'subcategory'
    }])
    const filteredTransformedData = transformedData.filter(data => !!data.priority)
    return filteredTransformedData;
  },

  createProduct: async function (params, userId, fromMaster = false) {
    let response = await new Promise(async (resolve) => {
      try {
        if (params.is_volume_based_price_enabled === true) {
          validateVolumeBasedProducts(params.volume_based_prices);
        }
        let product = await Product.create({
          sku: removeWhiteSpace(params.sku),
          name: params.name,
          size: params.size,
          unit: params.unit,
          brand: params.brand,
          urdu_name: params.urdu_name,
          urdu_unit: params.urdu_unit,
          urdu_size: params.urdu_size,
          urdu_brand: params.urdu_brand,
          disabled:
            params.disabled && params.disabled != "" ? params.disabled : 0,
          barcode: params.barcode,
          description: params.description,
          consent_required:
            typeof params.consent_required == "boolean"
              ? params.consent_required
              : parseInt(params.consent_required),
          location_id: parseInt(params.location_id),
          price: params.price,
          cost_price: params.cost_price,
          mrp: params.mrp,
          trade_price: params.trade_price,
          tax_percent: params.tax_percent,
          tax_inclusive: params.tax_inclusive,
          tax_category: params.tax_category,
          stock_quantity: 0,
          weight: params.weight,
          width: params.width,
          length: params.length,
          height: params.height,
          updated_by: params.updated_by,
          image_url: params.image_url,
          catalogue_product_id: params.catalogue_product_id
          ? params.catalogue_product_id
            : null,
          published: fromMaster ? true : false,
          delivery_time: adjustDeliveryTime(params.delivery_time),
          is_volume_based_price_enabled: params.is_volume_based_price_enabled === true,
          created_by: userId,
          marketplace_fvr: params.marketplace_fvr,
        });
        if (params.is_volume_based_price_enabled === true) {
          params.volume_based_prices.map(vbp => (vbp.productId = product.id));
          await createVolumeBasedProductPrices(params.volume_based_prices);
          sails.log.info(
            `ProductService.createProduct(): Volume based products ${params.volume_based_prices} have been created`
          );
        }
        /**
         * have to do this since sails doesn't support populate with create ORM 
         */
        const fetchedProduct = await Product.findOne({ id: product.id });
        fetchedProduct.location_id = await locationExtractionService.findOne({ id: product.location_id });
        OdooService.syncProductData(fetchedProduct);
        var tempProduct = product;
        var location_ids = [];
        location_ids.push(params.location_id);
        tempProduct["locations"] = location_ids;
        if (params.multilingual) {
          const multilingual = params.multilingual.map(language => { return { ...language, productId: product.id } })
          await ProductService.updateProductLanguages(multilingual);
        }
        sails.log.info(`context: ProductService.createProduct(), About to loop categories: ${params.categories}`);
        async.eachSeries(
          params.categories,
          function (cat, cb) {
            ProductService.createProductJunctionRow(product.id, cat.id, 'maxPriority')
              .then((res) => {
                cb();
              })
              .catch((err) => {
                cb(err);
              });
          },
          function (err, result) {
            if (err) {
              resolve({
                success: false,
                message:
                  "ERROR OCCURRED WHILE CREATING PRODUCT ASYNC CALL BACK",
                trace: err,
                type: ErrorTypes.SERVER_ERROR,
              });
            } else {
              const result = ProductService.updateProductInEs(product.id);
              result.then(response => {
                response.success
                      ? sails.log.info("SUCCESSFULLY CREATED PRODUCT IN ES")
                      : sails.log.info(result.trace);
              }).catch(e => {
                sails.log(`Exception: `, e);
              });
              resolve({ success: true, data: product });
            }
          }
        );
      } catch (err) {
        sails.log.error(`context: ProductService.createProduct(), Error: ${JSON.stringify(err.stack)}`);
        let errorMessage = "";
        const { code, message } = err;
        if (code === "E_UNIQUE") {errorMessage = message;}
        resolve({
          message:
            errorMessage !== ""
              ? errorMessage
              : `ERROR OCCURRED WHILE CREATING PRODUCT: ${err.message ?? err}`,
          type: ErrorTypes.SERVER_ERROR,
          trace: err,
          success: false,
        });
      }
    });

    return response;
  },

  buildCustomResponse: function (products) {
    return new Promise((resolve, reject) => {
      let index = 0;
      async.eachSeries(
        products,
        async function (product, callback) {
          var new_obj = _.omit(product, [
            "total_quanity",
            "attributes",
            "configurable",
            "urdu_name",
            "urdu_unit",
            "urdu_size",
            "urdu_brand",
            "promotion",
            "promotion_price",
            "cashback",
            "credit_cashback",
            "selling_price",
            "cost_price",
            "deleted",
            "product_description",
            "active_promotions",
            "isPromotion",
            "category_name",
            "category_img",
          ]);
          new_obj["category_info"] = {
            id: product.category_id,
            name: product.category_name,
            image_url: product.category_img,
          };
          const price = parseFloat(ProductService.getPriceByCategory(new_obj))
          const tax_amount = (parseFloat(new_obj.tax_percent) / 100) * parseFloat(price);
          new_obj["price"] = new_obj.tax_inclusive ? new_obj.price : new_obj.price + tax_amount;
          new_obj["tax_inclusive"] = 1;
          products[index] = new_obj;
          index += 1;
          callback();
        },
        function (err, success) {
          if (err) {
            console.log(err);
          } else {
            resolve(products);
          }
        }
      );
    });
  },
  getProducts: async (reqID, params) => {
    return new Promise(async (resolve, reject) => {
      try {
        sails.log.info(
          `reqID: ${reqID}, context: ProductService.getProducts params: ${JSON.stringify(
            params
          )}`
        );
        let products = [];
        let count = 0;
        let skip = 0;
        let limit = 10;
        if (params.page && params.page > 0) {
          skip = parseInt(params.page - 1) * parseInt(params.per_page);
        }
        if (params.per_page) {
          limit = parseInt(params.per_page) + skip;
        }
        sails.log(
          `reqID: ${reqID}, context: ProductService.getProducts Skip: ${skip} Limit: ${limit}`
        );
        params.showDisabled = (params.showDisabled && params.showDisabled == "true") ? true : false;
        if (!(
          params.sku ||
          params.id ||
          params.brands ||
          params.sizes ||
          params.search ||
          params.sort ||
          (params.location_id && !params.category_id)
        )) {
          products = await RedisService.getProducts(
            reqID,
            parseInt(params.category_id),
            skip,
            limit,
            params.showDisabled
          );
          count = products.count;
          products = products.products;
          sails.log(
            `reqID: ${reqID}, context: ProductService.getProducts, Redis products: ${products.length} Total: ${count}`
          );
        }
        if (products.length === 0) {
          products = await ProductService.getProductsFromDB(
            params.reqID,
            params
          );
          count = products.count;
          sails.log.info(
            `reqID: ${reqID}, context: ProductService.getProducts, DB products: ${count}`
          );
          products = products.products;
          // sort by priority
          if (!params.sort) {
            products = await products.sort(function (a, b) {
              return a.product_priority - b.product_priority;
            });
          }

          if (products.length > 0) {
            RedisService.setProducts(reqID, products, params.showDisabled);
          }

          // paginate
          if (!params.dontPaginate) {
            products = products.slice(skip, limit);
          }
        }

        sails.log.info(
          `reqID: ${reqID}, context: ProductService.getProducts, Paginated: ${products.length} Total Count: ${count} `
        );
        resolve({ products: products, totalCount: count });
      } catch (err) {
        sails.log.error(
          `reqID: ${reqID}, context: ProductService.getProducts, Error: ${JSON.stringify(
            err.stack
          )}`
        );
        resolve({ products: [], totalCount: 0 });
      }
    });
  },
  getProductsFromDB: async function (reqID, params) {
    try {
      sails.log.info(
        `reqID: ${reqID}, context: ProductService.getProductsFromDB, Fetching items from db ProductID: ${params.id} CategoryID: ${params.category_id} LocationID: ${params.location_id} `
      );
      var date = new Date();
      var query_params = [];
      // , categories.parent_id as parent_id
      var query =
        "select distinct products.id, product_categories_junction.category_id as category_id, product_categories_junction.product_priority, categories.name as category_name, categories.image_url as category_img, products.*";
      query += " from products";
      if (params.location_id) {
        query_params.push(params.location_id);
      }
      query +=
        " inner join product_categories_junction on products.id = product_categories_junction.product_id";
      query +=
        " inner join categories on product_categories_junction.category_id = categories.id";
      if (params.location_id) {
        query += " and products.location_id in (" + params.location_id + ")";
      }
      // query += " where products.disabled = false";
      if (!params.showDisabled) {
        query += " where products.disabled = false";
      }
      if (params.category_id) {
        query +=
          " and product_categories_junction.category_id = " +
          params.category_id;
        query_params.push(params.category_id);
      }
      if (params.id) {
        /* whats this for? */
        query += " and product_categories_junction.product_id = ?";
        query_params.push(params.id);
      }
      if (params.brands) {
        var brand = JSON.parse(params.brands);
        if (brand && brand.length > 0) {
          query += " and products.brand in (" + params.brand + ")";
        }
      }
      if (params.sizes) {
        var size = JSON.parse(params.sizes);
        if (size && size.length > 0) {
          query += " and products.size in (" + params.size + ")";
        }
      }
      if (params.search) {
        isPromotionalCategory = false;
        query += " and (products.name LIKE '%" + search + "%'";
        query += " or products.brand LIKE '%" + search + "%'";
        query += " or products.barcode LIKE '%" + search + "%'";
        query += " or products.urdu_name LIKE '%" + search + "%'";
        query += " or products.urdu_brand LIKE '%" + search + "%')";
      }
      // query += " group by products.id";

      if (params.sort == "name") {
        query += " order by products.name";
        if (params.sortType == "asc") {
          query += " asc ";
        } else {
          query += " desc ";
        }
      }
      if (params.sort == "price") {
        query += " order by products.price  ";
        if (params.sortType == "asc") {
          query += " asc ";
        } else {
          query += " desc ";
        }
      }
      if (params.sku) {
        query += " limit 1";
      }

      sails.log.info(
        `reqID: ${reqID}, context: ProductService.getProductsFromDB, DB query: ${query}`
      );
      sails.log.info(
        `reqID: ${reqID}, context: ProductService.getProductsFromDB, DB query params: ${query_params}`
      );
      let dbProducts = await new Promise((grandResolve, grandReject) => {
        Product.query(query, query_params, async function (err, products) {
          if (err) {
            sails.log.warn(
              `reqID: ${reqID}, context: ProductService.getProductsFromDB, Error: ${JSON.stringify(err.stack)}`
            );
          } else if (products) {
            sails.log.info(
              `reqID: ${reqID}, context: ProductService.getProductsFromDB, Products fetched from DB: ${products.rows.length}`
            );
            products = products.rows;
            if (products.length <= 0) {
              return grandResolve(null);
            } else {
              let newAddedProducts = await new Promise((resolve) => {
                ProductService.buildCustomResponse(products).then(
                  async (customProducts) => {
                    async.eachSeries(
                      customProducts,
                      function (product, cb) {
                        let location_prices = [
                          {
                            disabled: product.disabled,
                            price: product.price,
                            tax_inclusive: product.tax_inclusive,
                            tax_percent: product.tax_percent,
                          },
                        ];
                        product["location_prices"] = location_prices;
                        cb();
                      },
                      function (err, resp) {
                        return resolve(customProducts);
                      }
                    );
                  }
                );
              });
              return grandResolve(newAddedProducts);
            }
          } else {
            return grandResolve(null);
          }
        });
      });
      if (dbProducts) {
        sails.log.info(
          `reqID: ${reqID}, context: ProductService.getProductsFromDB, DB products: ${JSON.stringify(
            dbProducts
          )}`
        );
        return { products: dbProducts, count: dbProducts.length };
      } else {
        return { products: [], count: 0 };
      }
    } catch (err) {
      sails.log.error(
        `reqID: ${reqID}, context: ProductService.getProducts, Error: ${JSON.stringify(
          err.stack
        )}`
      );
      return { products: [], count: 0 };
    }
  },
  checkCategoriesAgainstLocation: async function (categoryIds, location_id) {
    let response = await new Promise(async (resolve) => {
      try {
        let categories = await Categories.find({ id: categoryIds });
        found_category_ids = categories.map(function (cat) {
          return cat.id;
        });
        categoryIds.forEach(function (cat) {
          if (!found_category_ids.includes(parseInt(cat))) {
            resolve({
              message: "CATEGORY DOESN'T EXIST!",
              type: ErrorTypes.BAD_REQUEST,
              trace: "checkCategoriesAgainstLocation",
              success: false,
            });
          }
        });
        var checkForCategoryLocation = false;
        async.eachSeries(
          categories,
          function (category, callback) {
            if (category) {
              if (category.location_id != location_id)
                checkForCategoryLocation = true;
            } else {
              checkForCategoryLocation = true;
            }
            callback();
          },
          function (err, result) {
            if (err) {
              reject(err);
            } else {
              if (!checkForCategoryLocation) {
                resolve({
                  success: true,
                });
              } else {
                resolve({
                  message: "CATEGORIES ARE NOT OF THE SAME LOCATION",
                  type: ErrorTypes.BAD_REQUEST,
                  trace: err,
                  success: false,
                });
              }
            }
          }
        );
      } catch (err) {
        reject(err);
      }
    });

    return response;
  },
  checkForDisabled: function (params) {
    return new Promise((resolve, reject) => {
      ProductLocationPrice.findOne({
        sku: params.sku,
        location_id: params.location_id,
      }).exec(function (err, foundLocation) {
        if (err) {
          reject(err);
        } else {
          if (foundLocation == undefined) reject();
          else if (!foundLocation.disabled) resolve();
          else reject();
        }
      });
    });
  },
  buildProductForCreation: async function (data, bulk, user_id, file_url) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        var productToCreate = {
          name: data.name,
          urdu_name: data.urdu_name ? data.urdu_name : "",
          sku: data.sku,
          size: data.size ? data.size : "",
          urdu_size: data.urdu_size ? data.urdu_size : "",
          brand: data.brand ? data.brand : "",
          urdu_brand: data.urdu_brand ? data.urdu_brand : "",
          category_id: data.category_id,
          categories: data.categories,
          description: data.description ? data.description : "",
          unit: data.unit ? data.unit : "",
          urdu_unit: data.urdu_unit ? data.urdu_unit : "",
          price: data.price,
          cost_price: data.cost_price,
          mrp: data.mrp,
          trade_price: data.trade_price,
          tax_percent: data.tax_percent,
          tax_inclusive: data.tax_inclusive ? data.tax_inclusive : 0,
          tax_category: data.tax_category,
          configurable: data.configurable ? data.configurable : 0,
          consent_required: data.consent_required ? data.consent_required : 0,
          stock_quantity: data.stock_quantity ? data.stock_quantity : 0,
          disabled: data.disabled ? data.disabled : 0,
          barcode: data.barcode,
          location_id: data.location_id,
          image_url: data.image_url ? data.image_url : "",
          delivery_time: data.delivery_time,
          created_by: user_id,
          marketplace_fvr: data.marketplace_fvr ? data.marketplace_fvr : 0,
        };
        resolve(productToCreate);
      } catch (err) {
        reject();
      }
    });
    return response;
  },

  findOrCreateCategoryAndSubCategory: async function (categories, location_id) {
    let response = await new Promise(async (resolve, reject) => {
      let parentId = 0;
      let categoryIds = [];
      let totalCount = await Categories.count({
        location_id: location_id,
        parent: null,
      });
      let subCatCount = 1;
      async.eachSeries(
        categories,
        async function (categoryName, callback) {
          if (!categories.indexOf(categoryName)) {
            try {
              let categoryFindOrCreate = await Categories.findOrCreate(
                {
                  name: categoryName,
                  location_id: location_id,
                },
                {
                  name: categoryName,
                  location_id: location_id,
                  start_date: new Date(),
                  end_date: new Date(),
                  priority: totalCount + 1,
                }
              );
              parentId = categoryFindOrCreate.id;
              categoryIds.push(categoryFindOrCreate.id);
              let tempCount = await Categories.count({
                location_id: location_id,
                parent: parentId,
              });
              if (tempCount && tempCount > 0) {
                subCatCount = tempCount + 1;
              }
              callback();
            } catch (err) {
              callback(err);
            }
          } else {
            try {
              Categories.findOrCreate(
                {
                  name: categoryName,
                  location_id: location_id,
                  parent: parentId,
                },
                {
                  name: categoryName,
                  location_id: location_id,
                  start_date: new Date(),
                  end_date: new Date(),
                  parent: parentId,
                  priority: subCatCount,
                }
              ).exec(async (err, subCategoryFindOrCreate, wasCreated) => {
                if (err) {
                  callback(err);
                } else {
                  if (wasCreated) {
                    subCatCount = subCatCount + 1;
                  }
                  categoryIds.push(subCategoryFindOrCreate.id);
                  callback();
                }
              });
            } catch (err) {
              callback(err);
            }
          }
        },
        function (err, result) {
          if (err) reject(err);
          else resolve(categoryIds);
        }
      );
    });
    return response;
  },

  createMasterCatalogue: async function (data) {
    let response = await new Promise(async (resolve, reject) => {
      let company_id = parseInt(data[16]);
      try {
        if (!company_id) {
          console.log("company not provided " + company_id);
          reject({
            message: "company not provided ",
            code: 1,
          });
        } else {
          let check_repeat = await CatalogueProducts.findOne({
            sku: data[17],
            catalogue_id: data[24],
          });
          if (check_repeat && check_repeat.length > 0) {
            reject({
              message: "already exists",
              code: 2,
            });
          } else {
            let imageUrl = "";
            try {
              imageUrl = data[23];
              if (imageUrl) {
                let fileContent = await http.get(imageUrl, {
                  responseType: "arraybuffer",
                });
                let fileName = uuid4();
                let ext = fileContent.headers["content-type"].split("/")[1];
                fileName += `.${ext}`;
                S3Service.uploadImage(fileContent.data, fileName);
                fileName = `https://${sails.config.globalConf.AWS_BUCKET}.s3.${sails.config.globalConf.AWS_REGION}.amazonaws.com/${fileName}`;
                sails.log(`s3 image: ${fileName}`);
                data[23] = fileName;
              }
            } catch (err) {
              data[23] = "";
            }
            try {
              let masterProductToCreate = await ProductService.buildMasterProductForCreationOrUpdation(
                data
              );
              try {
                let product = await CatalogueProducts.create(
                  masterProductToCreate
                );
                resolve(product);
              } catch (err) {
                let reason = "could not create";
                reject({
                  message: reason,
                  code: 1,
                });
              }
            } catch (err) {
              reject({
                message: err,
                code: 1,
              });
              console.log(reason + "- for product - " + data[1]);
              console.log("FILE COUNT - ", i);
            }
          }
        }
      } catch (err) {
        reject({
          message: err,
          code: 1,
        });
      }
    });
    return response;
  },
  updateMasterCatalogue: async function (data) {
    let response = await new Promise(async (resolve, reject) => {
      let company_id = parseInt(data[16]);
      try {
        if (!company_id) {
          console.log("company not provided " + company_id);
          reject({
            message: "company not provided ",
            code: 1,
          });
        } else {
          let check_repeat = await CatalogueProducts.findOne({
            sku: data[17],
            catalogue_id: data[24],
          });
          if (!check_repeat) {
            reject({
              message: "product not found",
              code: 2,
            });
          } else {
            let imageUrl = "";
            try {
              imageUrl = data[23];
              if (imageUrl) {
                let fileContent = await http.get(imageUrl, {
                  responseType: "arraybuffer",
                });
                let fileName = uuid4();
                let ext = fileContent.headers["content-type"].split("/")[1];
                fileName += `.${ext}`;
                S3Service.uploadImage(fileContent.data, fileName);
                fileName = `https://${sails.config.globalConf.AWS_BUCKET}.s3.${sails.config.globalConf.AWS_REGION}.amazonaws.com/${fileName}`;
                sails.log(`s3 image: ${fileName}`);
                data[23] = fileName;
              }
            } catch (err) {
              data[23] = "";
            }
            try {
              let masterProductToUpdate = await ProductService.buildMasterProductForCreationOrUpdation(
                data
              );
              delete masterProductToUpdate.category_id;
              try {
                let product = await CatalogueProducts.update(
                  { id: check_repeat.id },
                  masterProductToUpdate
                );
                resolve(product);
              } catch (err) {
                reject({
                  message: err,
                  code: 1,
                });
              }
            } catch (err) {
              reject({
                message: err,
                code: 1,
              });
              console.log(reason + "- for product - " + data[1]);
              console.log("FILE COUNT - ", i);
            }
          }
        }
      } catch (err) {
        reject({
          message: err,
          code: 1,
        });
      }
    });
    return response;
  },

  buildMasterProductForCreationOrUpdation: async function (data) {
    let response = await new Promise(async (resolve, reject) => {
      try {
        let categories = data[22].split("-");
        var productToCreate = {
          urdu_name: data[0],
          name: data[1],
          urdu_size: data[2],
          size: data[3],
          urdu_brand: data[4],
          brand: data[5],
          category_id: data[7] ? data[7].split(",") : "",
          urdu_unit: data[9],
          unit: data[10],
          disabled: data[11] && data[11] != "" ? parseInt(data[11]) : 0,
          barcode: data[14],
          sku: data[17],
          catalogue_id: parseInt(data[24]),
          price: parseFloat(data[6]),
          mrp: data[12] ? parseFloat(data[12]) : 0.0,
          cost_price: data[13] ? parseFloat(data[13]) : 0.0,
          description: data[18],
          tax_percent: data[19] && data[19] != "" ? data[19] : 0,
          tax_inclusive: data[20] && data[20] != "" ? parseInt(data[20]) : 0,
          consent_required: data[21] && data[21] != "" ? parseInt(data[21]) : 0,
          image_url: data[23],
          category_level_one: categories[0],
          category_level_two: categories[1],
        };
        resolve(productToCreate);
      } catch (err) {
        reject();
      }
    });
    return response;
  },

  /* NOTE: cloning products ( master to store ) */
  cloneMasterCatalogueToLocation: async function (params, products, user) {
    let catalog = await Catalog.findOne({
      id: params.catalogue_id,
    }).populate("company_id");
    let createdSkus = [];
    let errorSkus = [];
    let i = 1;
    let totalCount = await Categories.count({
      location_id: params.location_id,
      parent: null,
    });
    totalCount = totalCount + 1;
    for (var product of products) {
      let categoryIds = [];
      /* NOTE: create or find category level one */
      let parentCategory = await Categories.findOne({
        name: product.category_level_one.trim(),
        location_id: params.location_id,
      });
      if (parentCategory) categoryIds.push(parentCategory.id);
      else {
        let createdParentCategory = await Categories.create({
          name: product.category_level_one.trim(),
          start_date: new Date(),
          end_date: new Date(),
          parent: null,
          location_id: params.location_id,
          priority: totalCount,
        });
        totalCount += 1;
        categoryIds.push(createdParentCategory.id);
      }
      /* NOTE: create or find category level two */

      let childCategory = await Categories.findOne({
        name: product.category_level_two.trim(),
        location_id: params.location_id,
      });
      if (childCategory) categoryIds.push(childCategory.id);
      else {
        let subCount = await Categories.count({
          location_id: params.location_id,
          parent: categoryIds[0],
        });
        subCount = subCount + 1;
        let createdChildCategory = await Categories.create({
          name: product.category_level_two.trim(),
          start_date: new Date(),
          end_date: new Date(),
          parent: categoryIds[0],
          location_id: params.location_id,
          priority: subCount,
        });
        categoryIds.push(createdChildCategory.id);
      }
      product.category_id = categoryIds;
      product.stock_quantity = 1000;
      product.location_id = params.location_id;
      product.catalogue_product_id = product.id;
      product.priority = i;
      product.published = 1;
      delete product.catalogue_id;
      delete product.category_level_one;
      delete product.category_level_two;
      /* NOTE: generic sku creation while cloning
      reason to comment -> child sku will be same to the master sku, commented if needed in future
      let sku = await ProductService.createSkuForClonedProduct(
        params,
        product.sku
      );
      product.sku = sku;
      */
      let createdProduct = await ProductService.createProduct(product, user.id, true);
      if (createdProduct.success) {
        console.log("SUCCESS FULLY CLONED - ", product.name);
        createdSkus.push({
          index: i,
          reason: "successfully cloned",
          sku: product.sku,
        });
        console.log("created " + i);
        i++;
      } else {
        console.log("NOT CLONED - ", product.name);
        let reason = "could not create";
        errorSkus.push({
          index: i,
          reason: reason,
          sku: product.sku + "- not formed",
        });
        console.log(reason + i);
        i++;
      }
    }
    var html = "";
    if (errorSkus.length > 0) {
      html +=
        "<h2>Error SKUS</h2><table><tr><th>Index</th><th>SKU</th><th>Reason</th></tr>";
      var str = "";
      for (var row of errorSkus) {
        str +=
          "<tr><td>" +
          row.index +
          "</td>" +
          "<td>" +
          row.sku +
          "</td>" +
          "<td>" +
          row.reason +
          "</td></tr>";
      }
      html += str + "</table>";
    }
    if (createdSkus.length > 0) {
      var str = "";
      for (var row of createdSkus) {
        str +=
          "<tr><td>" +
          row.index +
          "</td>" +
          "<td>" +
          row.sku +
          "</td>" +
          "<td>" +
          row.reason +
          "</td></tr>";
      }
      html += "<h3>Created SKUS</h3>";
      html += "<p>" + str + "<p>";
    }
    html += "<h3>Summary</h3>";
    html += "<p>" + "Created SKUS: " + createdSkus.length + "</p>";
    html += "<p>" + "Error SKUS: " + errorSkus.length + "</p>";
    user = await AuthStoreService.populateHierarchyAccess(user);
    let recipients = await UtilService.getAccountEmails(user);
    if (user && user.email && user.email != "") recipients.push(user.email);
    let subject =
      catalog.company_id.name +
      " " +
      catalog.name +
      " Cloning Report On Location " +
      params.name +
      " - " +
      new Date();
    MailerService.sendMailThroughAmazon({
      email: recipients,
      htmlpart: html,
      subject: subject,
      destination: "operations@hypr.pk",
    });
  },

  createSkuForClonedProduct: async function (params, masterSku) {
    let response = new Promise(async (resolve, reject) => {
      masterSku = masterSku.split("-");
      let lastPart = masterSku[2]; /* NOTE: getting last part as 000001 */
      let firstPartOfShopName = params.name.split(" ");
      let locationSku =
        firstPartOfShopName[0] +
        "-" +
        parseInt(params.location_id) +
        "-" +
        lastPart;
      resolve(locationSku);
    });
    return response;
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  addProductsToAllChildCatalogues: async function (products, catalogId, user) {
    let locations = await Location.find({
      catalogue_id: catalogId,
    });
    if (locations.length) {
      /* NOTE: cloning newly added products to all child catalogues */
      for (let location of locations) {
        let params = {
          master_catalogue_id: catalogId,
          location_id: location.id,
          shopName: location.name,
        };
        ProductService.cloneMasterCatalogueToLocation(params, products, user);
      }
    }
  },
  // [DEPRECATED CALL]: need to remove this call
  createProductDeepLinks: async function (code) {
    await sails.getDatastore("readReplica").transaction(async (db) => {
      let company = await Companies.findOne({ code: code }).usingConnection(db);
      let locations = await Location.find({ company_id: company.id })
        .limit(1)
        .usingConnection(db);
      let query = `SELECT distinct products.* FROM products where location_id =  ${locations[0].id}`;

      let result = await sails.sendNativeQuery(query).usingConnection(db);

      let i = 1;
      var products = result.rows;
      if (products) {
        let fb_csv =
          "ID,title,description,google_product_category,link,image_link,condition,availability,price,sale_price,brand,item_group_id,Quantity,product_type,custom_label_0,custom_label_1,custom_label_2,custom_label_3,custom_label_4";
        let g_csv =
          "ID,Item title,Final URL,Image URL,Item subtitle,Item description,Item category,Price,Sale price,Contextual Keywords,Item Address";

        async.each(
          products,
          async (product, _callback) => {
            let subCatQuery = `select c.name as name, CASE WHEN c.parent_id is null THEN 0 ELSE 1 END as parent FROM product_categories_junction as pcj join categories as c on pcj.category_id = c.id where product_id = ${product.id}`;
            let cat_Info = await sails
              .sendNativeQuery(subCatQuery)
              .usingConnection(db);
            let subCat_query_value = cat_Info.rows;

            let l1_name = 0;
            let l2_name = 0;
            for (let row of subCat_query_value) {
              if (row.parent) l2_name = row.name;
              else l1_name = row.name;
            }

            var fb_product_obj;
            var g_product_obj;
            fb_product_obj = [
              product.sku ? '"' + product.sku + '"' : "",
              product.name ? '"' + product.name + '"' : "",
              product.description ? '"' + product.description + '"' : "",
              "Food Beverages & Tobacco > Food Items",
              `https://api.hypr.pk/product/productSku=${product.sku}`,
              product.image_url ? '"' + product.image_url + '"' : "",
              "new",
              "in stock",
              product.price ? '"' + "PKR " + product.price + '"' : "",
              product.price ? '"' + "PKR " + product.price + '"' : "",
              l1_name ? '"' + l1_name + '"' : "",
              product.sku ? '"' + product.sku + '"' : "",
              product.stock_quantity ? '"' + product.stock_quantity + '"' : "",
              "Full price",

              l2_name ? '"' + l2_name + '"' : "",
              "",
              "",
              "",
              "",
            ];

            g_product_obj = [
              product.sku ? '"' + product.sku + '"' : "",
              product.name ? '"' + product.name + '"' : "",
              `https://api.hypr.pk/product/productSku=${product.sku}`,
              product.image_url ? '"' + product.image_url + '"' : "",
              l2_name ? '"' + l2_name + '"' : "",
              product.description ? '"' + product.description + '"' : "",
              l1_name ? '"' + l1_name + '"' : "",
              product.price ? '"' + product.price + " PKR" + '"' : "",
              product.name ? '"' + product.name + l1_name + '"' : "",
              "- Lahore 54000 Pakistan - 206-S Quaid e Azam Industrial Estate Kotlakhpat - 31.446742 74.326487",
            ];
            fb_csv += "\n";
            fb_csv += fb_product_obj.join(",");
            g_csv += "\n";
            g_csv += g_product_obj.join(",");
            i++;
            _callback();
          },

          async function (err, result) {
            if (err) console.log(err);
            else {
              var s3 = new AWS.S3();
              var amazonFBfileName =
                process.env.NODE_ENV + "/" + code + "-product-fb-links";
              // amazonFBfileName = amazonFBfileName.replace(/[^a-zA-Z0-9]/g, "-");
              amazonFBfileName = amazonFBfileName + ".csv";
              var fb_params = {
                Bucket: sails.config.globalConf.AWS_BUCKET,
                Key: amazonFBfileName,
                Body: fb_csv,
                ContentType: "application/octet-stream",
                CacheControl: "public",
              };

              var amazonGfileName =
                process.env.NODE_ENV + "/" + code + "-product-google-links";
              // amazonGfileName = amazonGfileName.replace(/[^a-zA-Z0-9]/g, "-");
              amazonGfileName = amazonGfileName + ".csv";

              var g_params = {
                Bucket: sails.config.globalConf.AWS_BUCKET,
                Key: amazonGfileName,
                Body: g_csv,
                ContentType: "application/octet-stream",
                CacheControl: "public",
              };
              async.parallel(
                [
                  async function (callback) {
                    s3.putObject(fb_params, async function (err, data) {
                      if (err) {
                        console.log(
                          "Error at uploadCSVFileOnS3Bucket function",
                          err
                        );
                        callback(err);
                      } else {
                        console.log(" fb event File uploaded Successfully");
                        callback();
                      }
                    });
                  },

                  async function (callback) {
                    s3.putObject(g_params, async function (err, data) {
                      if (err) {
                        console.log(
                          "Error at uploadCSVFileOnS3Bucket function",
                          err
                        );
                        callback(err);
                      } else {
                        console.log("google event File uploaded Successfully");
                        callback();
                      }
                    });
                  },
                ],
                function () {
                  let FBfileName = `https://${sails.config.globalConf.AWS_BUCKET}.s3.${sails.config.globalConf.AWS_REGION}.amazonaws.com/${amazonFBfileName}`;
                  let GFileName = `https://${sails.config.globalConf.AWS_BUCKET}.s3.${sails.config.globalConf.AWS_REGION}.amazonaws.com/${amazonGfileName}`
                  sails.log(`deeplinks: ${FBfileName}, ${GFileName}`);
                }
              );
            }
          }
        );
      }
    });
  },
  resetCategoryProductsPriorityByCategory: async function (categoryId) {
    return new Promise(async (resolve, reject) => {
      try {
        sails.log("In resetCategoryProductsPriorityByCategory(), category: ", categoryId);
        let junctions = await ProductCategoriesJunction.find({
          category_id: categoryId
        });
        sails.log(`junctions fetched: ${JSON.stringify(junctions)}, count: ${junctions.length}`);
        let count = 0;
        for (const junction of junctions) {
          count++;
          let updateResponse = await ProductCategoriesJunction.updateOne(
            {
              category_id: categoryId,
              product_id: junction.product_id
            }
          ).set(
            { product_priority: count }
          );
          // await new Promise(res => setTimeout(res, 300)); // to introduce a delay if needed, however it worked fine for my local setup without it
          sails.log(`Update response: ${JSON.stringify(updateResponse)}`);
        }
        resolve("Priorities updated");

      } catch (err) {
        sails.log.error(`Error in resetCategoryProductsPriorityByCategory() -> ${JSON.stringify(err.stack)}`);
        reject(err);
      }
    });

  },

  getDimensions: async function (meta, file_name) {
    return new Promise(async (resolve, reject) => {
      try {
        let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${meta.caller},`;
        sails.log.info(`${logIdentifier} In ProductService.getDimensions() called with file_name -> ${JSON.stringify(file_name)}`);
        const s3Options = {
          Bucket: sails.config.globalConf.AWS_BUCKET,
          Key: file_name
        };
        const stream = s3.getObject(s3Options).createReadStream();
        let CSVData = await ProductService.StreamData(meta, stream);
        let dimensionsData = await ProductService.buildData(meta, CSVData);
        resolve({ sanity_check: true, data: dimensionsData });
      } catch (err) {
        sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${meta.caller}, Error in ProductService.getDimensions() -> ${JSON.stringify(err.stack || err)}`);
        reject({ sanity_check: false, error: err });
      }
    });
  },

  StreamData: async function (meta, stream) {
    return new Promise(async (resolve, reject) => {
      try {
        let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${meta.caller},`;
        sails.log.info(`${logIdentifier} In StreamData() called with stream -> ${JSON.stringify(stream)}`);
        let allCSVData = [];
        let firstLine = true;
        stream.pipe(csv()
          .on("data", async (data) => {
            if (firstLine) {
              firstLine = false;
            } else {
              allCSVData.push(data);
            }
          })
          .on("end", () => {
            resolve(allCSVData)
          })
        );
      }
      catch (err) {
        sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${meta.caller}, Error in BatchService.StreamData() -> ${JSON.stringify(err.stack)}`);
        reject(err);
      }
    });
  },

  buildData: async function (meta, CSVData) {
    return new Promise(async (resolve, reject) => {
      try {
        let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${meta.caller},`;
        sails.log.info(`${logIdentifier} In buildData() called with CSVData -> ${CSVData}`);
        let dimensionsData = [];
        async.eachSeries(
          CSVData,
          async (data, callback) => {
            const CSVRow = {
              sku_name: data[0],
              length: parseFloat(data[1]),
              width: parseFloat(data[2]),
              height: parseFloat(data[3]),
              weight: parseFloat(data[4]),
            };
            dimensionsData.push(CSVRow)
            callback();
          }
        );
        resolve(dimensionsData);
      } catch (err) {
        sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${meta.caller}, Error in BatchService.buildData() -> ${JSON.stringify(err.stack)}`);
        reject(err);
      }
    });
  },

  bulkUpdateDimensions: async function (meta, data) {
    return new Promise(async (resolve, reject) => {
      try {
        let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${meta.caller},`;
        sails.log.info(`${logIdentifier} In ProductService.bulkUpdateDimensions() called with data -> ${JSON.stringify(data)}`);
        for (product of data) {
          await Product.update({ sku: product.sku_name })
            .set({
              length: product.length,
              width: product.width,
              height: product.height,
              weight: product.weight,
            });
        }
        ProductService.sendDimensionMail(meta, null);
        resolve();
      } catch (err) {
        sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${meta.caller}, Error in ProductService.bulkUpdateDimensions() -> ${JSON.stringify(err.stack)}`);
        await ProductService.sendDimensionMail(meta, err);
        reject(err);
      }
    });
  },

  sendDimensionMail: async function (meta, error) {
    return new Promise(async (resolve, reject) => {
      try {
        let logIdentifier = `ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${meta.caller},`;
        sails.log.info(`${logIdentifier} In sendDimensionMail() called with error -> ${JSON.stringify(error)}`);

        var html = "";
        if (!error) {
          html = "<h2>DIMENSIONS UPDATED SUCCESSFULLY</h2>";
        } else {
          html = "<h2>DIMENSIONS UPDATE FAILED</h2>";
          html += "<p>" + "REASON: " + error + "</p>";
        }
        let user = await AuthStoreService.populateHierarchyAccess(
          meta.userData
        );
        let recipients = await UtilService.getAccountEmails(user);
        if (meta.userData.email && meta.userData.email != "")
          recipients.push(meta.userData.email);
        // MailerService.sendMailThroughAmazon({
        //   email: recipients,
        //   htmlpart: html,
        //   subject: "DIMENSIONS UPDATE REPORT - " + new Date(),
        //   destination: "operations@hypr.pk",
        // });
        resolve();
      } catch (err) {
        sails.log.error(`ReqID: ${meta.reqId}, UserID: ${meta.userData.id}, context: ${meta.caller}, Error in BatchService.sendBatchMail() -> ${JSON.stringify(err.stack)}`);
        reject(err);
      }
    });
  },
  /**
   *
   * @param {Object[]} products
   */
  populateProductTags: async products => {
    let productIds = products.map(product => product.id);
    let tagAssociations = await TagAssociationService.findTagAssociation(productIds);
    for (let productId of productIds) {
      let tagIds = tagAssociations.map(t => t.context_id === productId && t.tag_id).filter(tag => tag);
      if (tagIds.length) {
        let product = products.find(product => product.id === productId);
        let tags = await TagService.getByIds(tagIds);
        product.tags = tags;
      }
    }
  },
  /**
     *
     * @param {Object[]} product
     */
  getPriceByCategory: (product) => {
    let price = product.price;
    if (product.tax_category && product.tax_category === Constants.TAX_CATEGORIES.TAX_ON_MRP) {
      const basePriceFromMRP = product.mrp - product.mrp / (1 + (100 / product.tax_percent));
      price = basePriceFromMRP;
    } else if (product.tax_inclusive) {
      const basePriceFromSellingPrice = product.price - product.price / (1 + (product.tax_percent / 100));
      price = basePriceFromSellingPrice;
    }
    return price;
  },

  populateLanguages: async products => {
    const productIds = products.map(product => product.id);
    const multilingual = await ProductMultilingualAttributeDao.findAll({ productId: productIds });
    for (let product of products) {
      product.multilingual = multilingual.filter(language => language.productId == product.id);
    }
  },

  populateVolumeBasedProductPrice: async products => {
    const productIds = products.map((product) => product.id);

    const volumeBasedProductsPrices = await findVolumeBasedProductPrices({
      where: { productId: productIds },
      select: ["quantityTo", "quantityFrom", "price", "disabled", "productId"],
    });

    for (const product of products) {
      product.volume_based_prices = volumeBasedProductsPrices.filter(
        (volumeBasedProduct) => volumeBasedProduct.productId === product.id
      );
    }

    return products;
  },

  populateSkuDeactivationReason: async products => {
    const productIds = products.map((product) => product.id);

    const skuDeactivationReasons = await  Promise.all(productIds.map(
      productId => skuDeactivationReasonJunctionService.findLatestReasonOfProduct(productId)
    )); 

    for(const product of products) {
      const deactivationData = skuDeactivationReasons.find(data=>product.id == data[0]?.product_id)
      if(deactivationData) {
         product.is_deactivated = deactivationData[0]?.is_deactivated
         product.reason = deactivationData[0]?.reason
      }
      else {
         product.is_deactivated = false
         product.reason = null
      }
    }
  },


  updateProductLanguages: async productLangugages => {
    let languagePromise = [];
    const productIds = [...new Set(productLangugages.map(language => language.productId))]; // Get unique product ids
    const existingproductLanguages = await ProductMultilingualAttributeDao.findAll({ productId: productIds });
    for (const language of productLangugages) {
      const criteria = { productId: language.productId, language: language.language, attributeName: language.attributeName };
      const languageExists = existingproductLanguages.filter(existingLanguage => {
        return (existingLanguage.productId == language.productId &&
          existingLanguage.language == language.language &&
          existingLanguage.attributeName == language.attributeName);
      });
      if (_.isEmpty(languageExists)) {
        languagePromise.push(ProductMultilingualAttributeDao.create({ ...criteria, value: language.value }));
      } else {
        if (_.isEmpty(language.value)) {
          languagePromise.push(ProductMultilingualAttributeDao.remove(criteria));
        } else {
          languagePromise.push(ProductMultilingualAttributeDao.update(criteria, { value: language.value }));
        }
      }
    }
    await Promise.all(languagePromise);
  },
};
/**
 *
 * @param {Object[]} tags
 * @param {Number} productId
 */
const productTagAssociation = async (tags, productId) =>
  new Promise(async (resolve, reject) => {
    try {
      tags = tags.map(tag => tag.id && tag).filter(tag => tag);
      // Validation: create tag id for creating and updating associatoins.
      let tagsToUpdateAssociation = [];
      let tagsToCreateAssociation = [];
      let existingAssociations = await TagAssociationService.findTagAssociationByContextId(productId);
      tags.forEach(tag => {
        let existingAssociation = existingAssociations.find(existingAssociation => existingAssociation.tag_id === tag.id);
        if (!existingAssociation) {
          tagsToCreateAssociation = [...tagsToCreateAssociation, tag.id];
        }
        if (existingAssociation && existingAssociation.disabled) {
          tagsToUpdateAssociation = [...tagsToUpdateAssociation, tag.id];
        }
      });
      await updateProductTagAssociation(tagsToUpdateAssociation, productId);
      await createProductTagAssociation(tagsToCreateAssociation, productId);
      resolve();
    } catch (err) {
      let { code } = err;
      if (code === "E_UNIQUE") {
        err.message = 'Tag association alreaded added!';
      }
      let { raw } = err;
      if (raw && raw.code === 'ER_NO_REFERENCED_ROW_2') {
        err.message = 'Add valid Tags!';
        sails.log.error(`context: ProductService.productTagAssociation(), Error occurred while creating productTagAssociation: ${JSON.stringify(err.stack || err)}`);
        reject({ message: err.message, code: raw.code })
      }
      sails.log.error(`context: ProductService.productTagAssociation(), Error occurred while creating productTagAssociation: ${JSON.stringify(err.stack || err)}`);
      reject(err);
    }
  });

/**
 *
 * @param {NumberContext[]} tagIds
 * @param {Number} productId
 */
const removeProductTagAssociation = async (tagIds, productId) => {
  let tagsAssociationPromises = [];
  for (let i = 0; i < tagIds.length; i++) {
    // TODO get context name from the constants e.g context_name = product
    tagsAssociationPromises.push(TagAssociationService.removeTagAssociation(tagIds[i], productId, 'product'))
  }
  await Promise.all(tagsAssociationPromises);
  sails.log.info(`context: ProductService.removeProductTagAssociation(), Removed tag association: ${tagIds}`);
}

/**
 *
 * @param {Number[]} tagIds
 * @param {Number} productId
 */
const createProductTagAssociation = async (tagIds, productId) => {
  let tagsAssociationPromises = [];
  for (let i = 0; i < tagIds.length; i++) {
    // TODO get context name from the constants e.g context_name = product
    tagsAssociationPromises.push(TagAssociationService.addTagAssociation(tagIds[i], productId, 'product'))
  }
  await Promise.all(tagsAssociationPromises);
  sails.log.info(`context: ProductService.createProductTagAssociation(), Created tag associations: ${tagIds}`);
}

/**
 *
 * @param {Number[]} tagIds
 * @param {Number} productId
 */
const updateProductTagAssociation = async (tagIds, productId) => {
  let tagsAssociationPromises = [];
  for (let i = 0; i < tagIds.length; i++) {
    // TODO get context name from the constants e.g context_name = product
    tagsAssociationPromises.push(TagAssociationService.updateTagAssociation(tagIds[i], productId, 'product'))
  }
  await Promise.all(tagsAssociationPromises);
  sails.log.info(`context: ProductService.updateProductTagAssociation(), Updated tag associations: ${tagIds}`);
}

/**
 *
 * @param {String[]} tags
 */
const createNewTags = async tags =>
  new Promise(async (resolve, reject) => {
    try {
      tags = tags.map(tag => ({ name: tag.name.toLowerCase() }));
      let newTags = await TagService.bulkCreate(tags);
      sails.log.info(`context: ProductService.createNewTags(), Created new tags: ${newTags}`);
      resolve(newTags);
    } catch (err) {
      let { code } = err;
      if (code === "E_UNIQUE") {
        err.message = 'Tag already exists!';
      }
      sails.log.error(`context: ProductService.createNewTags(), Error occurred while creating tags: ${JSON.stringify(err.stack || err)}`);
      reject(err);
    }
  });
/**
*
* @param {Object[]} tagIds
* @param {String} productId
*/
const deleteProductTagSynonyms = async (tagIds, productId) => {
  let elasticAppSearchSynonymsTags = await ElasticAppSearchSynonymsTagsService.findElasticAppSearchSynonymsTagsByTagsIds(tagIds);
  let synonymsIds = elasticAppSearchSynonymsTags.map(elasticAppsearchSynonymTag => elasticAppsearchSynonymTag.synonyms_id);
  let elasticAppSearchSynonymsPromises = [];
  for (let synonymsId of synonymsIds) {
    elasticAppSearchSynonymsPromises.push(ElasticSearchService.getSynonymsById(synonymsId))
  }
  let elasticAppSearchSynonymsArray = await Promise.all(elasticAppSearchSynonymsPromises);
  for (let elasticAppSearchSynonyms of elasticAppSearchSynonymsArray) {
    let synonyms = elasticAppSearchSynonymsArray.find(elasticAppSearchSynonym => (elasticAppSearchSynonym.synonyms.indexOf(productId) !== -1) && elasticAppSearchSynonym.synonyms);
    if (synonyms) {
      let index = synonyms.synonyms.indexOf(productId)
      if (index > -1) {
        synonyms.synonyms.splice(index, 1);
      }
      if (synonyms.synonyms.length === 1) {
        await ElasticSearchService.deleteSynonyms(synonyms.id);
        await ElasticAppSearchSynonymsTagsService.deleteElasticAppSearchSynonymsTagsByTagsIds(synonyms.id);
      } else {
        elasticAppSearchSynonymsPromises.push(ElasticSearchService.updateSynonyms(elasticAppSearchSynonyms.id, synonyms.synonyms))
      }
    }

  }
  await Promise.all(elasticAppSearchSynonymsPromises);

}
/**
 *
 * @param {Object[]} tags
 * @param {String} productId
 */
const createProductTagSynonyms = async (tags, productId) => {
  // Create Product tag synonyms in Elastic App Search.
  let productTagSynonymsPromises = [];
  for (let tag of tags) {
    let synonyms = [tag.name, productId];
    productTagSynonymsPromises.push(ElasticSearchService.createSynonyms(synonyms))
  }
  let elasticAppSearchSynonymsArray = await Promise.all(productTagSynonymsPromises);

  let elasticAppSearchSynonymsTagsPromises = [];
  
  sails.log.info(`context: ProductService.createProductTagSynonyms(): ${JSON.stringify({ tags, elasticAppSearchSynonymsArray })}`);

  for (let tag of tags) {
    let elasticAppSearchSynonymsObject = elasticAppSearchSynonymsArray.find(elasticAppSearchSynonym => elasticAppSearchSynonym.synonyms.indexOf(tag.name) !== -1);
    
    sails.log.info(`context: ProductService.createProductTagSynonyms(), elasticAppSearchSynonymsObject: ${JSON.stringify(elasticAppSearchSynonymsObject)}`);

    elasticAppSearchSynonymsTagsPromises.push(ElasticAppSearchSynonymsTagsService.addElasticAppSearchSynonymsTags(tag.id, elasticAppSearchSynonymsObject.id))
  }
  await Promise.all(elasticAppSearchSynonymsTagsPromises);
}
/**
 *
 * @param {Object[]} tags
 * @param {String} productId
 */
const updateProductTagSynonyms = async (elasticAppsearchSynonymsTags, productId) => {
  let synonymsIds = elasticAppsearchSynonymsTags.map(elasticAppsearchSynonymTag => elasticAppsearchSynonymTag.synonyms_id);
  let elasticAppSearchSynonymsPromises = [];
  for (let synonymsId of synonymsIds) {
    elasticAppSearchSynonymsPromises.push(ElasticSearchService.getSynonymsById(synonymsId))
  }
  let elasticAppSearchSynonymsArray = await Promise.all(elasticAppSearchSynonymsPromises);
  let elasticAppSearchSynonymsUpdatePromises = []
  elasticAppSearchSynonymsArray.forEach(e => {
    let elasticAppSearchSynonym = elasticAppSearchSynonymsArray.find(elasticAppSearchSynonym => elasticAppSearchSynonym.synonyms.indexOf(productId) === -1);
    if (elasticAppSearchSynonym) {
      elasticAppSearchSynonymsArray = elasticAppSearchSynonymsArray.filter(e => e.id !== elasticAppSearchSynonym.id);
      let { synonyms } = elasticAppSearchSynonym;
      synonyms = [...synonyms, productId];
      elasticAppSearchSynonymsUpdatePromises.push(ElasticSearchService.updateSynonyms(elasticAppSearchSynonym.id, synonyms))
    }
  });
  await Promise.all(elasticAppSearchSynonymsUpdatePromises);
}
/**

 * @param {Number[]} tagIds
 * @param {String} productId
 */
const elasticAppSearchSynonyms = async (tags, productId) => {
  let tagIds = tags.map(tag => tag.id).filter(tag => tag);
  tags = await TagService.getByIds(tagIds);
  let elasticAppSearchSynonymsTags = await ElasticAppSearchSynonymsTagsService.findElasticAppSearchSynonymsTagsByTagsIds(tagIds);
  let tagsToUpdateSynpnyms = [];
  let tagsToCreateSynonyms = [];
  tags.forEach(tag => {
    let existingElasticAppSearchTagsSynonyms = elasticAppSearchSynonymsTags.find(elasticAppSearchSynonymTag => elasticAppSearchSynonymTag.tag_id === tag.id);
    if (!existingElasticAppSearchTagsSynonyms) {
      tagsToCreateSynonyms = [...tagsToCreateSynonyms, tag];
    }
    if (existingElasticAppSearchTagsSynonyms) {
      tagsToUpdateSynpnyms = [
        ...tagsToUpdateSynpnyms, {
          tag_id: existingElasticAppSearchTagsSynonyms.tag_id,
          synonyms_id: existingElasticAppSearchTagsSynonyms.synonyms_id
        }];
    }
  });
  await createProductTagSynonyms(tagsToCreateSynonyms, productId);
  await updateProductTagSynonyms(tagsToUpdateSynpnyms, productId);
}

/**
 * returns adjusted delivery time for products
 * @param deliveryTime
 */
const adjustDeliveryTime = (deliveryTime) => {
  if (deliveryTime) {
    if (deliveryTime > 168) return 168;
    else if (deliveryTime < 6) return 6;
    else if (["null", "NULL", "Null"].includes(deliveryTime)) return null;
    else return deliveryTime;
  }
  return null;
}
