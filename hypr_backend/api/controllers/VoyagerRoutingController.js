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

const nodesDataFileName = 'nodesDataFile';
const paramsFileName = 'paramsFile';
const nodesDataFilePath = '/input/nodesData.csv';
const paramsFilePath = '/input/params.csv';
const maximumTasksLimit = 200;


module.exports = {
  /**
   * Sails hanlder to fetch all running ECS tasks.
   */
  getAllTasks: (req, res, next) => {
    const { isV2 } = req.allParams();
    console.log(`VOYAGER: getAllTasks called - ${JSON.stringify(req.allParams())}`)
    VoyagerService.getAllTasks(isV2).then(tasksList => res.ok(tasksList))
      .catch(error => {
        sails.log.error("ERROR FETCHING TASKS", error)
        res.serverError(error);
      })
  },

  /**
   * Uploads and validates file contents
   */
  uploadFile: async (req, res, next) => {
    const { operationName } = req.allParams();
    let { isV2 } = req.allParams();
    const nodesDataFileStream = req.file(nodesDataFileName);
    const paramsFileStream = req.file(paramsFileName);
    module.exports.removeSailsFileHandler(req, [nodesDataFileName, paramsFileName]);
    const nodesDataFile = nodesDataFileStream._files[0];
    const paramsFile = paramsFileStream._files[0];
    //TODO Setup middleware to handle request body verification
    if (!nodesDataFile || !paramsFile || !operationName) {
      nodesDataFileStream.noMoreFiles();
      paramsFileStream.noMoreFiles();
      return res.badRequest({
        errorCode: 40001, // TODO SETUP ERROR CODE CONF,
        message: 'Missing or Malformed request params'
      });
    }

    const uploadNodeDataRequest = VoyagerService.upload(nodesDataFileStream, `${operationName}${nodesDataFilePath}`, isV2);
    const uploadParamRequest = VoyagerService.upload(paramsFileStream, `${operationName}${paramsFilePath}`, isV2);

    Promise.all([uploadNodeDataRequest, uploadParamRequest]).then(uploadDetails => {
      sails.log.info('UPLOAD ROUTING FILES SUCCESS')
      res.ok(uploadDetails)
    }).catch(err => {
      sails.log.error("ERROR UPLOADING ROUTING FILES", err)
      return res.serverError('Oh no, something went wrong');
    });

  },
  /**
   * sails handler for getting all files
   */
  getAllFiles: (req, res) => {
    const { isV2 } = req.allParams();
    VoyagerService.fetchAllObjectsFromBucket(isV2 ? Constants.S3_CONFIG.GLOBAL_PARAMS_V2 : Constants.S3_CONFIG.GLOBAL_PARAMS).then(s3ObjectList => {
      if (s3ObjectList) {
        res.ok(s3ObjectList);
      } else {
        res.serverError(); // TODO add error codes
      }
    }).catch((error) => {
      res.serverError();
    })
  },
  /**
   * Sails handler for fetching signed s3 url
   */
  getSignedUrl: (req, res) => {
    const { objectKey, isV2 } = req.allParams();
    VoyagerService.getSignedUrlForObject(objectKey, isV2).then((signedUrl) => {
      if (signedUrl) {
        res.ok(signedUrl);
      } else {
        res.serverError();
      }
    }).catch(error => {
      res.serverError();
    })
  },
  /**
   * Function runs a routing container on a given dataset.
   * params are dataFileUrl and paramFileUrl
   */
  runTask: async (req, res, next) => {
    const { operationName, isV2 } = req.allParams();
    if (!operationName) {
      return res.badRequest({
        message: "Missing operation name"
      });
    }
    const bucket = isV2 ? process.env.VOYAGER_BUCKET_V2 : process.env.VOYAGER_BUCKET;
    const dataFileUrl = `s3://${bucket}/${operationName}${nodesDataFilePath}`;
    const paramFileUrl = `s3://${bucket}/${operationName}${paramsFilePath}`;
    const objectKey = `${operationName}${paramsFilePath}`;
    const csvData = await VoyagerService.readS3Stream(objectKey, isV2);
    const mappedHeaders = VoyagerService.mapHeadersToIndex(csvData[0]);
    const clusters = VoyagerService.determineNumberOfClusters(csvData, mappedHeaders);
    let taskDefinitions = Constants.ECS_CONFIG.TASK_DEF;
    if (isV2) {
      taskDefinitions = await VoyagerService.getTaskDefinitions(csvData, mappedHeaders);
    }
    const runningTasks = await VoyagerService.getAllTasks(isV2);
    if (runningTasks.taskArns.length + clusters.length > maximumTasksLimit) {
      sails.error(`NUMBER OF  TASKS EXCEED THE LIMIT OF ${maximumTasksLimit}, Currently Running:${runningTasks.taskArns.length}. New request: ${clusters.length}`);
      return res.badRequest({
        message: `Number of tasks exceed the maximum limit of ${maximumTasksLimit}`,
        success: false
      });
    }
    const fargateTaskReqs = clusters.map(clusterLabel => VoyagerService.runTask(dataFileUrl, paramFileUrl, operationName, +clusterLabel, isV2 ? taskDefinitions[+clusterLabel] : taskDefinitions, isV2));
    Promise.all(fargateTaskReqs).then((response) => {
      res.ok({ fargateResponse: response, numberOfTasks: clusters });
    }).catch(error => {
      res.serverError({
        message: "OH NO!, Something went wrong starting routing tasks, please refer to cloudwatch logs.",
        error: error
      })
    })
  },

  /**
   * TODO REMOVE
   * THIS IS DEVELOP CODE NOT TO BE PUSHED TO PROD
   */
  readS3Stream: (req, res, next) => {
    const { objectKey, isV2 } = req.allParams();
    VoyagerService.readS3Stream(objectKey, isV2).then(data => {
      res.ok(VoyagerService.determineNumberOfClusters(data, VoyagerService.mapHeadersToIndex(data[0])))
    });
  },

  /**
   * Function runs validations on nodes Data input file.
   */
  validateData: async (req, res, next) => {
    const { operationName, isV2 } = req.allParams();
    if (!operationName) {
      return res.badRequest({
        message: "Missing operation name"
      });
    }
    const bucket = isV2 ? process.env.VOYAGER_BUCKET_V2 : process.env.VOYAGER_BUCKET;
    const dataFileUrl = `s3://${bucket}/${operationName}${nodesDataFilePath}`;
    const paramFileUrl = `s3://${bucket}/${operationName}${paramsFilePath}`;
    try {
      let taskDefinition = Constants.ECS_CONFIG.TASK_DEF;
      if (isV2) {
        const taskDefinitionList = await VoyagerService.listTaskDefinitions();
        taskDefinition = taskDefinitionList[0];
      }
      const validationReqResult = await VoyagerService.runTask(dataFileUrl, paramFileUrl, operationName, +'0', taskDefinition, isV2, true);
      if (validationReqResult) {
        res.ok(validationReqResult);
      } else {
        sails.log.error("Unable to start validation container");
        return res.serverError({
          success: false,
          message: "An error occurred while starting validation container."
        });
      }
    } catch (error) {
      sails.log.error("ERROR VALIDATING TASK", error);
      res.serverError({
        success: false,
        message: "An error occurred while starting validation container."
      });
    }
  },

  /**
   * Sails hanlder to fetch all running ECS tasks.
   */
  getTaskDescription: (req, res, next) => {
    const { isV2 } = req.allParams();
    VoyagerService.getAllTasks(isV2).then(tasksList => {
      console.log(tasksList);
      VoyagerService.describeTasks(tasksList.taskArns).then(data => {
        console.log('results', data);
        res.ok(data)
      });
    })
      .catch(error => {
        sails.log.error("ERROR FETCHING TASKS", error)
        res.serverError(error);
      })
  },

  /**
   * Sails hanlder to kill a specific ECS fargate tasks.
   */
  killTask: async (req, res, next) => {
    const { operationName, isV2 } = req.allParams();
    if (!operationName) {
      return res.badRequest({
        success: false,
        message: '"operationName" is required'
      });
    }
    try {
      const isolatedTasks = await module.exports.getTasksForOperation(operationName, isV2);
      if (isolatedTasks.length === 0) {
        return res.badRequest({
          success: false,
          message: 'No containers running for this operation'
        });
      }
      const killTaskResults = await VoyagerService.killTasks(isolatedTasks, isV2);
      res.ok(killTaskResults);
    } catch (error) {
      sails.log.error('Something went wrong stopping tasks', error);
      res.serverError({
        success: false,
        message: 'Something went wrong stopping tasks'
      });
    }
  },

  /**
   * TODO MOVE TO UTILS OR MIDDLEWARE
   * Function removes sails default file hanlder
   * Tells sails that is no-op for file upload.
   * @param requestObject: req obj from controller.
   * @param fileNames: string/[string]
   */
  removeSailsFileHandler: (requestObject, fileNames) => {
    if (!Array.isArray(fileNames)) {
      fileNames = [fileNames];
    }
    for (const name of fileNames) {
      requestObject.file(name).upload({ noop: true });
    }
  },
  /**
   * Function fetches tasks for specific operation
   * @param operationName: string
   * @returns Promise
   */
  getTasksForOperation(operationName, isV2) {
    return new Promise(async (resolve, reject) => {
      try {
        const tasksList = await VoyagerService.getAllTasks(isV2);
        if (tasksList.taskArns.length === 0) {
          sails.log.error('ERROR STOPPING TASKS, NO TASKS FOUND');
          return reject({
            message: 'No running tasks',
            success: false
          });
        }
        try {
          const taskDescriptions = await VoyagerService.describeTasks(tasksList.taskArns, isV2);
          const isolatedContainers = VoyagerService.isolateTaskContainers(operationName, taskDescriptions.tasks);
          resolve(isolatedContainers);
        } catch (error) {
          sails.log.error('ERROR FETCHING TASKS DESCRIPTIONS', error);
          reject();
        }

      } catch (error) {
        sails.log.error('ERROR STOPPING TASKS, NO TASKS FOUND', error);
        reject();
      }
    });
  },
}
