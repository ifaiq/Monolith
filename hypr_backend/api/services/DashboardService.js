var solidColors = {
  purple: "#873f7d",
  orange: "#ff8400",
  green: "#00837c",
  red: "#db5858",
};
module.exports = {
  dashboardData: function (
    res,
    startDate,
    endDate,
    userLocationStr,
    orderLocationStr,
    locationStr
  ) {
    return new Promise(async function (resolve, reject) {
      var data = {};
      async.parallel(
        [
          async function (callback) {
            let query = `SELECT COUNT(*) as dailyOrders
            ,COUNT(case status_id when ${Constants.HyprOrderStates.DELIVERED} then 1 else null end) completedOrders
            ,COUNT(case status_id when ${Constants.HyprOrderStates.PACKER_ASSIGNED} then 1 else null end) pendingOrders
            ,COUNT(case status_id when ${Constants.HyprOrderStates.REJECTED} then 1 else null end) rejectedOrders
            ,COUNT(case status_id when ${Constants.HyprOrderStates.PARTIAL_DELIVERED} then 1 else null end) partialDeliverOrders
            ,SUM(CASE When status_id in (${[Constants.HyprOrderStates.DELIVERED, Constants.HyprOrderStates.PARTIAL_DELIVERED]}) Then total_price Else 0 End) actualSales
            ,SUM(CASE When status_id in (${[Constants.HyprOrderStates.CANCELLED, Constants.HyprOrderStates.PACKER_CANCELLED]}) Then total_price Else 0 End) cancelledSales
            ,SUM(CASE When status_id in (${Constants.HyprOrderStates.IN_TRANSIT}) Then total_price Else 0 End) inTransitSales
            ,SUM(CASE When status_id in (${Constants.HyprOrderStates.PACKED}) Then total_price Else 0 End) packedSales
            ,SUM(CASE When status_id in (${[Constants.HyprOrderStates.RESERVED, Constants.HyprOrderStates.PACKER_ASSIGNED]}) Then total_price Else 0 End) notPackedSales
            ,SUM(CASE When status_id in (${[Constants.HyprOrderStates.REJECTED, Constants.HyprOrderStates.RETURNED]}) Then total_price Else 0 End) returnedSales
            ,avg(total_price) averageOrderPrice, COUNT(DISTINCT customer_id) as totalCustomers
            FROM orders o WHERE o.placed_at > $1 AND o.placed_at < $2 AND o.disabled=false ${orderLocationStr}`;
            try {
              sails.log(`DashboardData Query: ${query}, ${startDate}, ${endDate}`);
              let result = await sails.sendNativeQuery(query, [
                startDate,
                endDate,
              ]);
              let Orders = result.rows;
              if (Orders && Orders.length > 0) {
                data["dailyOrders"] = Orders[0].dailyOrders || 0;
                data["completedOrders"] = Orders[0].completedOrders || 0;
                data["pendingOrders"] = Orders[0].pendingOrders || 0;
                data["rejectedOrders"] = Orders[0].rejectedOrders || 0;
                data["partialDeliverOrders"] =
                  Orders[0].partialDeliverOrders || 0;
                data["actualSales"] = Orders[0].actualSales || 0;
                data["actualSales"] = data["actualSales"].toFixed(2);
                data["cancelledSales"] = Orders[0].cancelledSales || 0;
                data["cancelledSales"] = data["cancelledSales"].toFixed(2);
                data["inTransitSales"] = Orders[0].inTransitSales || 0;
                data["inTransitSales"] = data["inTransitSales"].toFixed(2);
                data["packedSales"] = Orders[0].packedSales || 0;
                data["packedSales"] = data["packedSales"].toFixed(2);
                data["notPackedSales"] = Orders[0].notPackedSales || 0;
                data["notPackedSales"] = data["notPackedSales"].toFixed(2);
                data["returnedSales"] = Orders[0].returnedSales || 0;
                data["returnedSales"] = data["returnedSales"].toFixed(2);
                data["averageOrderPrice"] = Orders[0].averageOrderPrice || 0;
                data["averageOrderPrice"] = data["averageOrderPrice"].toFixed(
                  2
                );
                data["totalCustomers"] = Orders[0].totalCustomers || 0;
              } else {
                data["dailyOrders"] = 0;
                data["completedOrders"] = 0;
                data["pendingOrders"] = 0;
                data["rejectedOrders"] = 0;
                data["partialDeliverOrders"] = 0;
                data["actualSales"] = "0.00";
                data["cancelledSales"] = "0.00";
                data["inTransitSales"] = "0.00";
                data["packedSales"] = "0.00";
                data["notPackedSales"] = "0.00";
                data["averageOrderPrice"] = "0.00";
                data["totalCustomers"] = 0;
              }
              callback();
            } catch (err) {
              callback(err);
            }
          },

          // To get total GMV as 'totalSales'
          async function (callback) {
            try {
              sails.log.info(`Querying for total GMV`);
              let query = `select sum(price * original_quantity) as total_sales from order_items oi join orders o on oi.order_id = o.id where o.placed_at >= $1 and o.placed_at <= $2 and o.disabled = false and o.status_id not in 
              (${[Constants.HyprOrderStates.SALE_ORDER, Constants.HyprOrderStates.MissingID]}) ${orderLocationStr}`;
              sails.log(`Querying: ${query}, ${startDate}, ${endDate}`);
              let result = await sails.sendNativeQuery(query, [
                startDate,
                endDate
              ]);
              sails.log(`Query response: ${JSON.stringify(result.rows)}`);
              let totalSales = result.rows;
              data["totalSales"] = totalSales ? totalSales[0].total_sales || 0 : 0;
              data["totalSales"] = data["totalSales"].toFixed(2) || 0;
              callback();
            } catch(err) {
              sails.log.error(`ERROR, ${err}`);
              callback(err)
            }
          },

          async function (callback) {
            let query =`select count(distinct(o.id)) as orderCount from order_items as o1, 
            orders as o where o1.order_id = o.id and o1.original_quantity != o1.quantity 
            AND o.placed_at > $1 AND o.placed_at < $2 AND o.disabled=false ${orderLocationStr}`;

            try {
              let result = await sails.sendNativeQuery(query, [
                startDate,
                endDate,
              ]);
              let modifiedOrders = result.rows;
              data["modifiedOrders"] = modifiedOrders
                ? modifiedOrders[0].orderCount || 0
                : 0;
              callback();
            } catch (err) {
              callback(err);
            }
          },
          async function (callback) {
            let query =`SELECT COUNT(customer_id), customer_id FROM orders o 
            WHERE o.placed_at > $1 and o.placed_at < $2 and o.disabled=false ${orderLocationStr} GROUP BY customer_id HAVING COUNT(customer_id) > $3`;
            try {
              let result = await sails.sendNativeQuery(query, [
                startDate,
                endDate,
                1,
              ]);
              let repeatingCustomers = result.rows;
              data["repeatingCustomers"] = repeatingCustomers
                ? repeatingCustomers.length
                : 0;
              callback();
            } catch (err) {
              callback(err);
            }
          },
          async function (callback) {
            let query =`SELECT avg(orderItemCount) as averageOrderItems FROM 
            (SELECT order_id,SUM(oi.quantity) as orderItemCount FROM order_items oi JOIN orders o 
            ON o.id = oi.order_id where o.placed_at > $1 and o.placed_at < $2 and o.disabled=false ${orderLocationStr}
            GROUP BY oi.order_id) as orderItems`;
            try {
              let result = await sails.sendNativeQuery(query, [
                startDate,
                endDate,
              ]);
              let averageOrderItems = result.rows;
              data["averageOrderItems"] = averageOrderItems
                ? averageOrderItems[0].averageOrderItems || 0
                : 0;
              data["averageOrderItems"] = data["averageOrderItems"].toFixed(2);
              callback();
            } catch (err) {
              callback(err);
            }
          },
          async function (callback) {
            let query =`SELECT CASE WHEN ot.original_quantity != ot.quantity 
            THEN sum(ot.price*(ot.original_quantity - ot.quantity)) 
            ELSE sum(ot.price*(ot.original_quantity - ot.quantity)) END as partialSales 
            FROM orders o join order_items ot on o.id = ot.order_id 
            WHERE o.placed_at > $1 and o.placed_at < $2 ${orderLocationStr} and o.status_id in 
            (${Constants.HyprOrderStates.PARTIAL_DELIVERED}) and o.disabled=false`;
            try {
              let result = await sails.sendNativeQuery(query, [
                startDate,
                endDate,
              ]);
              let partialSales = result.rows;
              data["partialSales"] = partialSales
                ? partialSales[0].partialSales || 0
                : 0;
              data["partialSales"] = data["partialSales"].toFixed(2);
              callback();
            } catch (err) {
              callback(err);
            }
          }, //Average Lead Time
          async function (callback) {
            let query =`select avg(diff) as hourDiff from 
            (SELECT TIMESTAMPDIFF(HOUR,o1.created_at,o2.created_at) as diff FROM order_history as o2 
            inner join order_history as o1 on o2.order_id = o1.order_id inner join orders as o 
            on o.id = o1.order_id where o1.status_id = 1 and o2.status_id= 9 and o2.created_at > $1 
            and o2.created_at < $2 and o.disabled = false ${orderLocationStr} Group By o.id) as leadTime`;
            try {
              let result = await sails.sendNativeQuery(query, [
                startDate,
                endDate,
              ]);
              let leadTime = result.rows;
              data["leadTime"] = leadTime ? leadTime[0].hourDiff || 0 : 0;
              data["leadTime"] = data["leadTime"].toFixed(0);
              callback();
            } catch (err) {
              callback(err);
            }
          }, //Packaging Time
          async function (callback) {
            let query =`select avg(diff) as hourDiff from 
            (SELECT TIMESTAMPDIFF(HOUR,o1.created_at,o2.created_at) as diff FROM
            order_history as o2 inner join order_history as o1 on o2.order_id = o1.order_id 
            inner join orders as o on o.id = o1.order_id where o1.status_id = 1 and o2.status_id= 4 
            and o2.created_at > $1 and o2.created_at < $2 and o.disabled = false ${orderLocationStr}  
            Group By o.id) as packingTime`;
            try {
              let result = await sails.sendNativeQuery(query, [
                startDate,
                endDate,
              ]);
              let packingTime = result.rows;
              data["packingTime"] = packingTime
                ? packingTime[0].hourDiff || 0
                : 0;
              data["packingTime"] = data["packingTime"].toFixed(0);
              callback();
            } catch (err) {
              callback(err);
            }
          }, //transit Time
          async function (callback) {
            let query =`select avg(diff) as hourDiff from (SELECT TIMESTAMPDIFF(HOUR,o1.created_at,o2.created_at) as diff FROM 
          order_history as o2 inner join order_history as o1 on o2.order_id = o1.order_id 
          inner join orders as o on o.id = o1.order_id where o1.status_id = 4 and o2.status_id= 9 and o2.created_at > $1 
          and o2.created_at < $2 and o.disabled = false ${orderLocationStr} Group By o.id) as transitTime`;
            try {
              let result = await sails.sendNativeQuery(query, [
                startDate,
                endDate,
              ]);
              let transitTime = result.rows;
              data["transitTime"] = transitTime
                ? transitTime[0].hourDiff || 0
                : 0;
              data["transitTime"] = data["transitTime"].toFixed(0);
              callback();
            } catch (err) {
              callback(err);
            }
          },
          async function (callback) {
            try {
              let query =`SELECT pcj.category_id,pc.name, SUM(ot.price) as hyprPrice FROM orders 
              as o JOIN order_items as ot ON o.id=ot.order_id JOIN product_categories_junction as pcj 
              ON ot.product_id=pcj.product_id JOIN categories as pc ON pcj.category_id=pc.id 
              WHERE o.placed_at > $1 and o.placed_at < $2 ${orderLocationStr}
              GROUP BY pcj.category_id ORDER BY hyprPrice DESC LIMIT 5`;

              let result = await sails.sendNativeQuery(query, [
                startDate,
                endDate,
              ]);
              let categoriesChart = result.rows;

              var chartLabels = [],
                chartData = [],
                sum = 0,
                skuChart = [];
              categoriesChart = categoriesChart ? categoriesChart : [];
              for (var chart of categoriesChart) {
                sum += chart.hyprPrice;
              }
              for (var chart of categoriesChart) {
                chartLabels.push(chart.name);
                chartData.push(((chart.hyprPrice / sum) * 100).toFixed(2));
              }
              var colors = [
                "#ff8400",
                "#e65400",
                "#742068",
                "#50544d",
                "#00837c",
              ];
              var i = 0;
              async.eachSeries(
                categoriesChart,
                async function (chart, _callback) {
                  var skuChartData = [],
                    skuChartLabels = [],
                    skuChartColors = [],
                    skuChartName = [];

                  let query =`SELECT p.sku as sku, ot.product_id, p.name, SUM(ot.price) as price 
                  FROM orders as o JOIN order_items as ot ON o.id=ot.order_id JOIN products p 
                  ON p.id = ot.product_id JOIN product_categories_junction as pcj ON ot.product_id=pcj.product_id 
                  JOIN categories as pc ON pcj.category_id=pc.id 
                  WHERE o.placed_at > $1 AND o.placed_at < $2 AND pcj.category_id= $3 ${orderLocationStr} 
                  GROUP BY ot.product_id, p.name LIMIT 5`;

                  let skuResult = await sails.sendNativeQuery(query, [
                    startDate,
                    endDate,
                    chart.category_id,
                  ]);
                  let skus = skuResult.rows;
                  for (var sku of skus) {
                    skuChartName.push(sku.name);
                    skuChartLabels.push(sku.sku);
                    skuChartData.push(sku.price);
                    skuChartColors.push(colors[i]);
                  }
                  skuChart.push({
                    name: skuChartName,
                    labels: skuChartLabels,
                    data: [
                      {
                        data: skuChartData,
                        label: "TOP ITEMS IN " + chart.name,
                      },
                    ],
                    colors: [{ backgroundColor: skuChartColors }],
                  });
                  i++;
                  _callback();
                },
                function (err, result) {
                  if (err) {
                    callback(err);
                  } else {
                    data["categoriesChartData"] = {
                      labels: chartLabels,
                      data: [{ data: chartData }],
                      colors: [{ backgroundColor: colors }],
                      skuChart: skuChart,
                    };
                    callback();
                  }
                }
              );
            } catch (err) {
              callback(err);
            }
          },
          //lead Time graph
          async function (callback) {
            try {
              let query =`SELECT DATE(o2.created_at) as dateTime,DAYNAME(o2.created_at) as day, avg(TIMESTAMPDIFF(HOUR,o1.created_at,o2.created_at)) as leadTime FROM
          order_history as o2 inner join order_history as o1 on o2.order_id = o1.order_id 
          inner join orders as o on o.id = o1.order_id where o1.status_id = 1 and o2.status_id= 9 
          and o2.created_at > $1 and o2.created_at < $2 and o.disabled = false ${orderLocationStr}
          Group By DATE(o2.created_at) , DAYNAME(o2.created_at) order by DATE(o2.created_at) asc `;

              let result = await sails.sendNativeQuery(query, [
                startDate,
                endDate,
              ]);
              let leadTimeChartData = result.rows;

              var chartLabels = [],
                chartData = [];
              leadTimeChartData = leadTimeChartData ? leadTimeChartData : [];
              var leadTime = [];
              for (var chart of leadTimeChartData) {
                chartLabels.push(chart.day);
                if (chart.leadTime) {
                  leadTime.push(chart.leadTime.toFixed(0));
                } else {
                  leadTime.push(0);
                }
              }
              chartData.push({ data: leadTime, label: "Avg. Lead Time" });
              data["leadTimeLineChartData"] = {
                labels: chartLabels,
                data: chartData,
                colors: [
                  {
                    backgroundColor: "rgba(253, 246, 238, 1)",
                    borderColor: solidColors.orange,
                    fill: true,
                  },
                ],
              };
              callback();
            } catch (err) {
              callback(err);
            }
          }, //packing time graph
          async function (callback) {
            try {
              let query =`SELECT DATE(o2.created_at) as dateTime,DAYNAME(o2.created_at) as day, avg(TIMESTAMPDIFF(HOUR,o1.created_at,o2.created_at)) as packingTime FROM
          order_history as o2 inner join order_history as o1 on o2.order_id = o1.order_id inner join orders as o on o.id = o1.order_id 
          where o1.status_id = 1 and o2.status_id= 4 and o2.created_at > $1 and o2.created_at < $2 and o.disabled = false ${orderLocationStr}
          Group By DATE(o2.created_at) , DAYNAME(o2.created_at) order by DATE(o2.created_at) asc `;
              let result = await sails.sendNativeQuery(query, [
                startDate,
                endDate,
              ]);
              let packingTimeChartData = result.rows;
              var chartLabels = [],
                chartData = [];
              packingTimeChartData = packingTimeChartData
                ? packingTimeChartData
                : [];
              var packingTime = [];
              for (var chart of packingTimeChartData) {
                chartLabels.push(chart.day);
                if (chart.packingTime) {
                  packingTime.push(chart.packingTime.toFixed(0));
                } else {
                  packingTime.push(0);
                }
              }
              chartData.push({ data: packingTime, label: "Avg. Packing Time" });
              data["packingTimeLineChartData"] = {
                labels: chartLabels,
                data: chartData,
                colors: [
                  {
                    backgroundColor: "rgba(253, 246, 238, 1)",
                    borderColor: solidColors.orange,
                    fill: true,
                  },
                ],
              };
              callback();
            } catch (err) {
              callback(err);
            }
          }, // Transit Time graph
          async function (callback) {
            try {
              let query =`SELECT DATE(o2.created_at) as dateTime,DAYNAME(o2.created_at) as day, avg(TIMESTAMPDIFF(HOUR,o1.created_at,o2.created_at)) as transitTime FROM \
          order_history as o2 inner join order_history as o1 on o2.order_id = o1.order_id 
          inner join orders as o on o.id = o1.order_id where o1.status_id = 4 and o2.status_id= 9 
          and o2.created_at > $1 and o2.created_at < $2 and o.disabled = false ${orderLocationStr}
          Group By DATE(o2.created_at) , DAYNAME(o2.created_at) order by DATE(o2.created_at) asc `;
              let result = await sails.sendNativeQuery(query, [
                startDate,
                endDate,
              ]);
              let transitTimeChartData = result.rows;

              var chartLabels = [],
                chartData = [];
              transitTimeChartData = transitTimeChartData
                ? transitTimeChartData
                : [];
              var transitTime = [];
              for (var chart of transitTimeChartData) {
                chartLabels.push(chart.day);
                if (chart.transitTime) {
                  transitTime.push(chart.transitTime.toFixed(0));
                } else {
                  transitTime.push(0);
                }
              }
              chartData.push({ data: transitTime, label: "Avg. Transit Time" });
              data["transitTimeLineChartData"] = {
                labels: chartLabels,
                data: chartData,
                colors: [
                  {
                    backgroundColor: "rgba(253, 246, 238, 1)",
                    borderColor: solidColors.orange,
                    fill: true,
                  },
                ],
              };
              callback();
            } catch (err) {
              callback(err);
            }
          },
        ],
        function (err, result) {
          if (err) reject(err);
          resolve(data);
        }
      );
    });
  },
};
