module.exports = {
  "GET /routing/allTasks": "VoyagerRoutingController.getAllTasks",
  "POST /routing/upload": "VoyagerRoutingController.uploadFile",
  "GET /routing/getInputFiles": "VoyagerRoutingController.getAllFiles",
  "POST /routing/getDownloadLink": "VoyagerRoutingController.getSignedUrl",
  "POST /routing/runTask": "VoyagerRoutingController.runTask",
  "POST /routing/readS3Stream": "VoyagerRoutingController.readS3Stream",
  "POST /routing/validateData": "VoyagerRoutingController.validateData",
  "POST /routing/killTask": "VoyagerRoutingController.killTask",
  "GET /routing/describeTasks": "VoyagerRoutingController.getTaskDescription"
}
