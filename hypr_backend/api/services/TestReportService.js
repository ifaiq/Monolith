module.exports = {
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  generateMailReport: function () {
    var startDate = new Date();
    var endDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 59);
    var startActiveTime = new Date(startDate);
    startActiveTime.setHours(startActiveTime.getHours() + 9);
    var endActiveTime = new Date(endDate);
    endActiveTime.setHours(endActiveTime.getHours() - 5);
    var month = startDate.getMonth() + 1;
    var a = " and ";
    var customTags = {
      totalSales: "<p> Total Sales &nbsp; <%%> </p>",
      totalMargin: "<p> Total Margin &nbsp; <%%> </p>",
    };
    var checks = {
      dateLessThan: "order.placed_at < ?",
      dateGreaterThan: "order.placed_at > ?",
      disabledCheck: "order.disabled = false",
      notFinalStatuses: "order.status_id NOT IN (8,9,10,11,12,13,14)",
      deliveredStatus: "order.status_id IN (9,12)",
      rejectedStatus: "order.status_id = 10",
      CNAStatus: "order.status_id = 8",
      salesAgentId: "order.sales_agent_id = ?",
      noSalesAgent: "order.sales_agent_id IS NULL",
    };
    var basicCheck =
      checks.dateGreaterThan +
      a +
      checks.dateLessThan +
      a +
      checks.disabledCheck;
    var basicParams = [startDate, endDate];
    var queries = [
      {
        name: "revenue",
        query:
          "SELECT SUM(total_price) as revenue FROM `order` WHERE " + basicCheck,
        params: basicParams,
        for: ["S", "HP", "A", "C"],
        tag: "<p>Revenue (Rs.) &nbsp; <%%></p>",
      },
      {
        name: "completedOrders",
        query:
          "SELECT COUNT(*) as completedOrders FROM `order` WHERE " +
          checks.deliveredStatus +
          a +
          basicCheck,
        params: basicParams,
        for: ["S", "HP", "A", "C"],
        tag: "<p>Total Orders &nbsp; <%%></p>",
      },
      {
        name: "totalItemsSold",
        query:
          "SELECT count(order_items.id) as totalItemsSold FROM `order` JOIN `order_items` ON order.id=order_items.order_id WHERE " +
          basicCheck,
        params: basicParams,
        for: ["S", "HP", "A", "C"],
        tag: "<p>Items sold &nbsp; <%%></p>",
      },
      {
        name: "margin",
        query:
          "SELECT (sum(order_items.price)) - (sum(inventory.inventory_price*order_items.quantity)) as margin FROM `order` JOIN `order_items` ON  order.id=order_items.order_id JOIN `inventory` ON order_items.product_id = inventory.product_id WHERE " +
          basicCheck,
        params: basicParams,
        for: ["S", "HP", "A", "C"],
        tag: "<p>Margin (Rs.) &nbsp; <%%></p>",
      },
      {
        name: "marginPercentile",
        query:
          "SELECT (((sum(order_items.price)) - (sum(inventory.inventory_price*order_items.quantity)))/(sum(order_items.price)))*100 as marginPercentile FROM `order` JOIN `order_items` ON  order.id=order_items.order_id JOIN `inventory` ON order_items.product_id = inventory.product_id WHERE " +
          basicCheck,
        params: basicParams,
        for: ["S", "HP", "A", "C"],
        tag: "<p>Margin (%) &nbsp; <%%></p>",
      },
      {
        name: "uniqueSkus",
        query:
          "SELECT count(distinct(order_items.product_id)) as uniqueSkus FROM `order` JOIN `order_items` ON  order.id=order_items.order_id WHERE " +
          basicCheck,
        params: basicParams,
        for: ["S", "HP", "A", "C"],
        tag: "<p>Unique SKUs &nbsp; <%%></p>",
      },
      {
        name: "newCustomers",
        query:
          "SELECT count(order.customer_id) as newCustomers FROM `order` JOIN (SELECT customer_id  FROM `order`  GROUP BY customer_id  HAVING COUNT(*) = 1) customer ON customer.customer_id = order.customer_id where " +
          basicCheck,
        params: basicParams,
        for: ["S", "HP", "A", "C"],
        tag: "<p>New Customers &nbsp; <%%></p>",
      },
      {
        name: "totalCustomers",
        query:
          "SELECT count(distinct(order.customer_id)) as totalCustomers FROM `order` WHERE " +
          basicCheck,
        params: basicParams,
        for: ["S", "HP", "A", "C"],
        tag: "<p>Total Customers &nbsp; <%%></p>",
      },
    ];
    var data = {};
    async.parallel(
      [
        function (callback) {
          //Cell Data Location
          Location.find({ disabled: false, company_id: 1 }).exec(function (
            err,
            locations
          ) {
            data["locations"] = [];
            async.eachSeries(
              locations,
              function (location, _callback) {
                var location_data = { name: location.name, users: [] };
                var basicAddition = a + "order.location_id = " + location.id;
                async.eachSeries(
                  queries,
                  function (query, __callback) {
                    if (query.for.indexOf("C") == -1) {
                      __callback();
                    } else {
                      if (
                        query.name == "margin" ||
                        query.name == "marginPercentile"
                      ) {
                        basicAddition =
                          basicAddition +
                          " and inventory.location_id = " +
                          location.id;
                      }
                      Order.query(
                        query.query + basicAddition,
                        query.params,
                        function (err, result) {
                          if (result.length > 0) {
                            if (result[0][query.name] == null) {
                              location_data[query.name] = 0;
                            } else {
                              location_data[query.name] = result[0][
                                query.name
                              ].toFixed(2);
                            }
                            basicAddition =
                              a + "order.location_id = " + location.id;
                            __callback();
                          }
                        }
                      );
                    }
                  },
                  function (err, result) {
                    Order.query(
                      "SELECT pcj.category_id,pc.name, SUM(ot.price) as hyprPrice FROM `order` JOIN `order_items` as ot ON order.id=ot.order_id JOIN `product_categories_junction` as pcj ON ot.product_id=pcj.product_id JOIN `product_categories` as pc ON pcj.category_id=pc.id WHERE " +
                        basicCheck +
                        basicAddition +
                        " GROUP BY pcj.category_id ORDER BY hyprPrice DESC LIMIT 5",
                      [startDate, endDate],
                      function (err, topCategories) {
                        if (err) {
                          console.log(err);
                        } else {
                          var sum = 0;
                          var topCats = [];
                          async.each(
                            topCategories,
                            function (cat, cb) {
                              sum += cat.hyprPrice;
                              cb();
                            },
                            function (err, result) {
                              if (err) {
                                console.log(err);
                              } else {
                                async.each(
                                  topCategories,
                                  function (cat, cb) {
                                    var obj = {
                                      catName: cat.name,
                                      percentile: (
                                        (cat.hyprPrice / sum) *
                                        100
                                      ).toFixed(2),
                                    };
                                    topCats.push(obj);
                                    cb();
                                  },
                                  function (err, result) {
                                    location_data["topCategories"] = topCats;
                                    data.locations.push(location_data);
                                    _callback();
                                  }
                                );
                              }
                            }
                          );
                        }
                      }
                    );
                  }
                );
              },
              function (err, result) {
                callback();
              }
            );
          });
        },
        function (callback) {
          //Customer Data
          data["customer"] = {};
          async.eachSeries(
            queries,
            function (query, _callback) {
              if (query.for.indexOf("Cust") == -1) {
                _callback();
              } else {
                Order.query(query.query, query.params, function (err, result) {
                  if (result.length > 0) {
                    data.customer[query.name] = result[0][query.name] || 0;
                  }
                  _callback();
                });
              }
            },
            function (err, result) {
              callback();
            }
          );
        },
        function (callback) {
          //Calculating margin data
          data["margin"] = {};
          async.parallel(
            [
              function (callBack) {
                async.eachSeries(
                  queries,
                  function (query, _callback) {
                    if (query.for.indexOf("Mar") == -1) {
                      _callback();
                    } else {
                      Order.query(query.query, query.params, function (
                        err,
                        result
                      ) {
                        if (result.length > 0) {
                          data.margin[query.name] = result[0][query.name] || 0;
                        }
                        _callback();
                      });
                    }
                  },
                  function (err, result) {
                    callBack();
                  }
                );
              },
              function (callBack) {
                Order.query(
                  "SELECT pcj.category_id,pc.name,SUM(ot.price) as hyprPrice,SUM(ot.cost_inventory+ot.cost_buying) as costPrice FROM `order` as o JOIN `order_items` as ot ON o.id=ot.order_id JOIN `product_categories_junction` as pcj ON ot.product_id=pcj.product_id JOIN `product_categories` as pc ON pcj.category_id=pc.id WHERE o.placed_at < ? AND o.placed_at > ?  AND o.status_id IN (9,12) and ot.removed=false GROUP BY pcj.category_id",
                  [endDate, startDate],
                  function (err, categoryMargin) {
                    var categories = [];
                    async.each(
                      categoryMargin,
                      function (cat, next) {
                        Order.query(
                          "SELECT p.sku, ot.product_id,pcj.category_id,SUM(ot.price) as hyprPrice,SUM(ot.cost_inventory+ot.cost_buying) as costPrice, SUM(ot.quantity) as totalQuantity FROM `order` as o JOIN `order_items` as ot ON o.id=ot.order_id JOIN product p ON p.id = ot.product_id JOIN `product_categories_junction` as pcj ON ot.product_id=pcj.product_id JOIN `product_categories` as pc ON pcj.category_id=pc.id WHERE o.placed_at < ? AND o.placed_at > ? AND pcj.category_id=? AND o.status_id IN (9,12) and ot.removed=false GROUP BY ot.product_id",
                          [endDate, startDate, cat.category_id],
                          function (err, skuMargin) {
                            var data = {
                              categoryName: cat.name,
                              categoryId: cat.category_id,
                              costPrice: cat.costPrice,
                              hyprPrice: cat.hyprPrice,
                              skus: [],
                            };
                            for (var sku of skuMargin) {
                              data.skus.push(sku);
                            }
                            categories.push(data);
                            next();
                          }
                        );
                      },
                      function (err, result) {
                        data.margin.categories = categories;
                        callBack();
                      }
                    );
                  }
                );
              },
            ],
            function (err, result) {
              callback();
            }
          );
        },
      ],
      function (err, result) {
        console.log(JSON.stringify(data, null, 4));
        //Creating EMAIL TEMPLATE
        var tags = [
          "<h2>",
          "</h2>",
          "<h3>",
          "</h3>",
          "<h4>",
          "</h4>",
          "<strong>",
          "</strong>",
          "<p>",
          "</p>",
        ];
        var text = "";
        text +=
          tags[0] +
          "Number of active cells - " +
          data.locations.length +
          tags[1];
        text += tags[0] + "Name of active cells - ";
        for (var location of data.locations) {
          text += location.name;
          if (data.locations.indexOf(location) != data.locations.length - 1) {
            text += ",";
          } else {
            text += tags[1];
          }
        }
        for (var location of data.locations) {
          text += tags[0] + "Cell - " + location.name + tags[1];
          text =
            text + TestReportService.createHTMLFormat(queries, "C", location);
          if (location.topCategories.length > 0) {
            text += tags[0] + "Top Five Categories : " + tags[1];
            for (var cat of location.topCategories)
              text +=
                tags[8] + cat.catName + " - " + cat.percentile + "%" + tags[9];
          }
        }
        MailingList.findOne({ mailing_list_name: "dailyReport" }).exec(
          function (err, MailingList) {
            MailerService.sendMailThroughAmazon({
              email: JSON.parse(MailingList.mailing_list_user),
              htmlpart: text,
              subject: "HYPR Daily Sales Report - " + new Date(),
              destination: "operations@hypr.pk",
            });
          }
        );
      }
    );
  },
  getDistance: function (lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = TestReportService.deg2rad(lat2 - lat1); // deg2rad below
    var dLon = TestReportService.deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(TestReportService.deg2rad(lat1)) *
        Math.cos(TestReportService.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
  },
  deg2rad: function (deg) {
    return deg * (Math.PI / 180);
  },
  createHTMLFormat: function (queries, char, obj) {
    var text = "";
    for (var query of queries) {
      if (query.for.indexOf(char) != -1) {
        text = text + query.tag.replace("<%%>", obj[query.name]);
      }
    }
    return text;
  },
  getMargin(salePrice, costPrice) {
    return (((salePrice - costPrice) / salePrice) * 100).toFixed(2) + "%";
  },
};
