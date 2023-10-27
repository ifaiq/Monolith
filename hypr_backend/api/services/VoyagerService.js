/**
 Copyright © 2021 Retailo, Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * Voyager S3 Interface Service
 */

// AWS IMPORTS
const AWS = require('aws-sdk');

// THIRD PARTY IMPORTS
const csv = require('fast-csv');
const Moment = require('moment');

// Setting AWS Config
// TODO REMOVE,  TESTING FOR DEVELOP
// const credentials = new AWS.SharedIniFileCredentials({profile: 'voyager-service'});
// AWS.config.credentials = credentials;
AWS.config.region = process.env.VOYAGER_REGION;
const s3 = new AWS.S3({
  signatureVersion: 'v4',
  region: process.env.VOYAGER_REGION,
  accessKeyId: process.env.voyager_service_aws_access_key_id, // TODO REMOVE WHEN S3  migration is complete
  secretAccessKey: process.env.voyager_service_aws_secret_access_key
});
const ecs = new AWS.ECS({
  accessKeyId: process.env.voyager_service_aws_access_key_id, // TODO REMOVE WHEN S3  migration is complete
  secretAccessKey: process.env.voyager_service_aws_secret_access_key
});

const networkParams = { // subject to change hence keeping it in this file
  awsvpcConfiguration: {
    subnets: [process.env.VOYAGER_SUBNET_ID],
    assignPublicIp: 'ENABLED'
  }
};

module.exports = {
  /**
   * Function uploads file to S3
   * @param file: file object
   * @param filePath: string, where to upload the file in the bucket.
   */
  upload: async (file, filePath, isV2) => {
    return new Promise((resolve, reject) => {
      if (!file || !filePath) {
        return reject(false);
      }
      console.log(`VOYAGER SERVICE: {UPLOAD} isV2 - ${isV2}`);
      const bucket = isV2 ? process.env.VOYAGER_BUCKET_V2 : process.env.VOYAGER_BUCKET;
      console.log(`VOYAGER SERVICE: {UPLOAD} going to use bucket - ${bucket}`);
      const options = {
        adapter: require("skipper-better-s3"),
        key: process.env.voyager_service_aws_access_key_id,
        secret: process.env.voyager_service_aws_secret_access_key,
        bucket,
        s3Params: { Key: filePath.toString().trim() },
        region: process.env.VOYAGER_REGION,
        saveAs: filePath,
        noop: true
      };

      console.log(`VOYAGER SERVICE: {UPLOAD} options - ${JSON.stringify(options)}`);

      file.upload(options, (err, files) => {
        if (!err) {
          sails.log.info({ message: `UploadController-uploadImageToS3: Uploaded successfully: ${filePath}`});
          resolve({ link: files[0].extra.Location });
        }
      });
    });
  },
  /**
   * Function fetches all files from a bucket
   * @param bucketParams, optional, name of bucket.
   * @param sortList, optional, sorts the s3 object list
   */
  fetchAllObjectsFromBucket: (bucketParams = Constants.S3_CONFIG.GLOBAL_PARAMS, sortList = true) => {
    return new Promise((resolve, reject) => {
      s3.listObjectsV2(bucketParams, async (error, s3ObjectList) => {
        if (error) {
          sails.log.error(`S3 INTERFACE: Error fetching bucket details ${bucketParams}\n ${JSON.stringify(error)}`);
          reject(false);
        } else {
          sails.log.info(`S3 INTERFACE: Object list fetched successfully ${JSON.stringify(bucketParams)}`);

          console.log(`VOYAGER SERVICE: objects from bucket - ${JSON.stringify(s3ObjectList)}`)
          if (s3ObjectList.IsTruncated) {
            bucketParams['ContinuationToken'] = s3ObjectList.NextContinuationToken;
            const paginatedObjectList = await VoyagerService.fetchAllObjectsFromBucket(bucketParams, false);
            s3ObjectList.Contents = [...s3ObjectList.Contents, ...paginatedObjectList.Contents];
            s3ObjectList.KeyCount += paginatedObjectList.KeyCount;
            if (sortList) {
              console.log(`VOYAGER SERVICE: sorting list - ${JSON.stringify(s3ObjectList)}`)
              VoyagerService.sortS3ItemList(s3ObjectList);
            }
            resolve(s3ObjectList);
          } else {
            if (sortList) {
              VoyagerService.sortS3ItemList(s3ObjectList);
            }
            console.log(`VOYAGER SERVICE: sorted list - ${JSON.stringify(s3ObjectList)}`)
            resolve(s3ObjectList);
          }
        }
      });
    });
  },
  /**
   * Does what is says on the tin.
   * @param objectKey: string
   */
  getSignedUrlForObject: (objectKey, isV2) => {
    return new Promise((resolve, reject) => {
      if (!objectKey) {
        sails.log.error(`S3 INTERFACE: Error no object key to fetch`);
        reject(false);
      } else {
        const globalParams = isV2 ? Constants.S3_CONFIG.GLOBAL_PARAMS_V2 : Constants.S3_CONFIG.GLOBAL_PARAMS;
        const s3RequestParams = { Key: objectKey, ...globalParams, ...Constants.S3_CONFIG.DOWNLOAD_SIGNED_CONFIG }
        s3.getSignedUrl('getObject', s3RequestParams, (error, signedUrl) => {
          if (error) {
            sails.log.error(`S3 INTERFACE: Error fetching fetching signed URL: ${objectKey}, ERROR: ${JSON.stringify(error)}`);
            reject(false);
          } else {
            sails.log.info(`S3 INTERFACE: signed Url fetched successfully ${objectKey}`);
            resolve(signedUrl);
          }
        });
      }
    });
  },
  /**
   * Function fetchs all running tasks from ECS API.
   * Will to used to throttle maximum concurrent instance from the frontend.
   */
  getAllTasks: (isV2 = false) => {
    console.log(`VOYAGER SERVICE: {GET_ALL_TASKS} isV2 - ${isV2}`)
    const cluster = isV2 ? Constants.ECS_CONFIG.CLUSTER_V2 : Constants.ECS_CONFIG.CLUSTER;
    console.log(`VOYAGER SERVICE: {GET_ALL_TASKS} going to use cluster - ${cluster}`)
    return new Promise((resolve, reject) => {
      ecs.listTasks({ cluster: cluster}, (err, tasksDetails) => {
        if (!err) {
          console.log(`VOYAGER SERVICE: {GET_ALL_TASKS} - ${JSON.stringify(tasksDetails)}`);
          resolve(tasksDetails);
        } else {
          console.log(`VOYAGER SERVICE: {GET_ALL_TASKS} - ERROR`);
          console.log(err)
          reject (err);
        }
      })
    })
  },
  /**
   * Function handles starting an ECS Fargate task
   * @param dataFileUrl: string
   * @param: paramFileUrl: string
   * @returns Promise
   */
  runTask: (dataFileUrl, paramFileUrl, operationName, clusterNumber, taskDefinition, isV2, isValidationContainer = false) => {
    return new Promise((resolve, reject) => {
      if (!dataFileUrl || !paramFileUrl) {
        return reject({ message: "Malformed or missing params"});
      }
      const env = [{
        name: 'DATA_FILE_URL',
        value: dataFileUrl
      }, {
        name: 'PARAM_FILE_URL',
        value: paramFileUrl
      },{
        name: 'OPERATION_NAME',
        value: operationName
      }, {
        name: 'CLUSTER_LABEL',
        value: `${clusterNumber}`
      }];
      env.push({
        name: 'IS_VALIDATION_CONTAINER',
        value: isValidationContainer? 'true' : 'false'
      });
      sails.log.info(`Runnung voyager ECS task. 
        Cluster: ${isV2 ? Constants.ECS_CONFIG.CLUSTER_V2 : Constants.ECS_CONFIG.CLUSTER},
        Task Definition: ${taskDefinition}`);
      ecs.runTask({
        cluster: isV2 ? Constants.ECS_CONFIG.CLUSTER_V2 : Constants.ECS_CONFIG.CLUSTER,
        count: '1',
        launchType: 'FARGATE',
        taskDefinition: taskDefinition, networkConfiguration: networkParams,
        overrides: {
          containerOverrides: [{
            environment: env,
            name: isV2? process.env.VOYAGER_NAME_V2 : process.env.VOYAGER_NAME 
          }]
        },
        tags: [{
          key: 'operationName',
          value: operationName}
        ]}, (err, taskParams) => {
          if (!err) {
            resolve(taskParams);
          } else {
            sails.log.error(err);
            reject (err);
          }
        }
      );
    });
  },

  /**
   * Reads a CSV file from s3 storage
   * @params objectKey: string location to the s3 object.
   * @returns promise
   */
  readS3Stream: (objectKey, isV2) => {
   return new Promise((resolve, reject) => {
     const globalParams = isV2 ? Constants.S3_CONFIG.GLOBAL_PARAMS_V2 : Constants.S3_CONFIG.GLOBAL_PARAMS;
     const s3RequestParams = { Key: objectKey, ...globalParams };
     const csvData = [];
     s3.getObject(s3RequestParams, (err, objectDetails) => {
       if (err) {
         reject(err)
       }
     }).createReadStream().pipe(csv()
       .on('data', (row) => csvData.push(row))
       .on('error', (error) => reject(error)))
       .on('end', () => resolve(csvData));
   })
  },

  /**
   * Function maps array indexes to CSV columsn
   * @param array of columns
   */
    mapHeadersToIndex: (headers) => {
      return headers.reduce((mappedObject, header, index) => {
        mappedObject[header] = index;
        return mappedObject;
      }, {});
  },

  /**
   * Function determines and identifies  number of unique clusters from  param files
   * @param paramsFileCsvData: array of param file rows.
   * @param mappedHeaders: Object that has the column index for cluster Number
   * @returns array: numbers.
   */
  determineNumberOfClusters: (paramsFileCsvData, mappedHeaders) => {
      const indexOfClusterNumber = mappedHeaders['Cluster'];
      const clusterSet  = new Set();
      for (let  i = 1; i < paramsFileCsvData.length; i++) { // skip the headers i.e row 0
        clusterSet.add(paramsFileCsvData[i][indexOfClusterNumber]);
      }
      return Array.from(clusterSet).filter(number => !isNaN(+number)  && +number % 1 === 0);
  },

  /**
   * Function returns all task definitions
   * @returns array: string
   */
  listTaskDefinitions: () => {
    return new Promise((resolve, reject) => {
      ecs.listTaskDefinitions({familyPrefix: "voyager-v2-task", status: "ACTIVE"}, function(err, data) {
        if (!err) {
          resolve(data.taskDefinitionArns);
        } else {
          reject (err);
        }
      });
    });
  },

  /**
   * Function returns task definition description
   * @param paramsFileCsvData: array of param file rows.
   * @returns array: string
   */
  describeTaskDefinition: (taskDefinition) => {
    return new Promise((resolve, reject) => {
      ecs.describeTaskDefinition({taskDefinition: taskDefinition.split("/")[1]}, function(err, data) {
        if (!err) {
          resolve(data);
        } else {
          reject (err);
        }
      });
    });
  },

  /**
   * Function determines task definition based on cores assigned to clusters
   * @param paramsFileCsvData: array of param file rows.
   * @param mappedHeaders: Object that has the column index for cluster Number
   * @param clusters: Array of clusters from param files
   * @returns array: numbers.
   */
  getTaskDefinitions: async (paramsFileCsvData, mappedHeaders) => {
    const attributeIndex = mappedHeaders['Attribute'];
    const valueIndex = Constants.VOYAGER.CSV_CPU_VALUE_INDEX;

    let cpuValues = [null]; // Filling 0 index so each csv row is mapped according to cluster number
    paramsFileCsvData.forEach(csvRow => {
      if (csvRow[attributeIndex] === "Compute_v2") {
        cpuValues.push(csvRow[valueIndex]);
      }
    })

    let taskDefinitionList = await VoyagerService.listTaskDefinitions();
    const promise = taskDefinitionList.map(taskDefinition => VoyagerService.describeTaskDefinition(taskDefinition));

    let taskDefinitions;
    try {
      taskDefinitions = await Promise.all(promise);
    } catch (error) {
      throw error;
    }

    let response = [null]; // Filling 0 index so each TD is mapped according to cluster number
    cpuValues.forEach(cpuValue => {
      for (let taskDefinition of taskDefinitions) {
        if (+cpuValue === +taskDefinition.taskDefinition.cpu && +taskDefinition.taskDefinition.memory >= Constants.VOYAGER.MIN_MEMORY) {
          response.push(taskDefinition.taskDefinition.taskDefinitionArn);
          break;
        }
      }
    })

    return response;
  },

  /**
   * Function validates data in each cluster from the node data file.
   * @param nodeDataRows: entire csv data from node  data file.
   * @param mappedHeaders: to determine the index for clusterId
   * @param clusterIds: unique cluster numbers.
   * @returns Object: { '*cluster-number*': true || false (based if  the cluster has valid data or  not )}
   */
  validateNodeData: (nodeDataRows, mappedHeaders, clusterIds) => {
    const indexOfClusterNumber = mappedHeaders['Cluster'];
    const isolotaedData = nodeDataRows.reduce((isolatedClusters, dataRow) => {
      const clusterNumber = dataRow[indexOfClusterNumber];
      if (!isNaN(+clusterNumber)  && +clusterNumber % 1 === 0) {
        if (!isolatedClusters[clusterNumber]) {
          isolatedClusters[clusterNumber] = [];
        }
        isolatedClusters[clusterNumber].push(dataRow);
      }
      return isolatedClusters;
    }, {});

    const validatedData = clusterIds.reduce((validatedClusters, clusterId) => {
          validatedClusters[clusterId] = module.exports.validateCluster(isolotaedData[clusterId], mappedHeaders);
          return  validatedClusters;
    }, {});
    return validatedData;
  },

  /**
   * Function runs validations on node data.
   * @param nodeDataArray: Array of CSV rows.
   * @param mappedHeaders: Object
   * @returns boolean
   */
  validateCluster(nodeDataArray, mappedHeaders) {
    let isClusterDataValid = true;
    const nodeLabels = [];
    for (const dataRow of nodeDataArray) {
      for (const header of  Object.keys(mappedHeaders)) {
        const columnValue = dataRow[mappedHeaders[header]];
        switch (header) {
          case 'Node_Label':
            if (!columnValue) { // TODO REFACTOR ||  nodeLabels.find(nodeLabel => nodeLabel === columnValue)
              isClusterDataValid = false;
              break;
            }
            nodeLabels.push(columnValue);
            break;
          case 'Lat':
            if(!columnValue || isNaN(+columnValue)) {
              isClusterDataValid = false;
              break;
            }
            break;
          case 'Long':
            if(!columnValue || isNaN(+columnValue)) {
              isClusterDataValid = false;
              break;
            }
            break;
          case 'Weight':
            if ((!columnValue || isNaN(+columnValue) || +columnValue < 0)) {
              isClusterDataValid = false;
              break;
            }
              break;
          case 'Volume':
            if ((!columnValue || isNaN(+columnValue) || +columnValue < 0)) {
              isClusterDataValid = false;
              break;
            }
                break;
          case 'Area':
                // Just a placeholder for now in the  csv
                // TODO remove if not needed
                break;
          case 'Service_Time':
            if ((!columnValue || isNaN(+columnValue) || +columnValue < 0)) {
              isClusterDataValid = false;
              break;
            }
            break;
          case 'Cluster':
            if (!columnValue || isNaN(+columnValue)) {
              isClusterDataValid = false;
              break;
            }
            break;
        }
      if (!isClusterDataValid) {
        break;
        }
      }
      if (!isClusterDataValid) {
        break;
      }
    }

  //  Todo Add validations.
    return isClusterDataValid;
  },

  /**
   * Function runs fetches task description from fargate.
   * @param taskArray: List of task Arns
   * @returns Promise
   */
  describeTasks(taskArray, isV2 = false) {
    return new Promise((resolve, reject) => {
      const params = {
        tasks: taskArray,
        cluster: isV2 ? Constants.ECS_CONFIG.CLUSTER_V2 : Constants.ECS_CONFIG.CLUSTER
      };
      ecs.describeTasks(params, (err, descriptions) => {
        if(err) {
          console.log(err);
          return reject(err);
        } else {
          resolve(descriptions);
        }
      })
    })
  },
  /**
   * Function filters and maps running containers based on operation name.
   * @param operationName: string
   * @param tasks: [ ] returned from getAll Tasks API.
   * @returns [{taskArn: '----', envVariables: [] } ]
   */
  isolateTaskContainers(operationName, tasks) {
    const tasksMappedToArn = tasks.map(task => {
      return {
        taskArn: task.containers[0].taskArn,
        envVariables: task.overrides.containerOverrides[0].environment
      }}); // end of map

    const tasksForOperation = tasksMappedToArn.filter((task) => {
      for (const env of task.envVariables) {
        if (env.name === 'OPERATION_NAME') {
          if (env.value === operationName) {
            return true;
          }
        }
      }
      return false;
    }); // end of filter
    return tasksForOperation;
  }, // end of function

  /**
   * Function creates requests to stop ECS fargate tasks.
   * @param tasksArns: [{taskArn: '------',...}...]
   * @returns @promise
   */
  killTasks(tasksArns, isV2) {
     const targetList = tasksArns.map(taskContainer => {
       return {
         task: taskContainer.taskArn,
         cluster: isV2 ? Constants.ECS_CONFIG.CLUSTER_V2 : Constants.ECS_CONFIG.CLUSTER
       }
     });
     const killTaskReqs = targetList.map((task) => { // create Reqs to stop tasks.
       return new Promise((resolve, reject) => {
         ecs.stopTask(task, (err, success) => {
           if(!err) {
             resolve(success);
           } else {
             reject(err);
           }
         })
       });
     });
     return new Promise((resolve, reject) => { // fire reqs to stop tasks, return concatenated results
       Promise.all(killTaskReqs).then((taskDetails) => {
         // Mission successful, good effect on target.
         resolve(taskDetails);
       }).catch(err => {
         // Mission failed, we'll get 'em next time.
         reject(err);
       });
     });
  },
  /**
   * Function sorts array entities by last modified date
   * @param s3ObjectList, AWS SDK fetch items response
   */
  sortS3ItemList(s3ObjectList) {
    s3ObjectList.Contents.sort((a,b) => new Moment(b.LastModified).valueOf() - new Moment(a.LastModified).valueOf());
  }
}
