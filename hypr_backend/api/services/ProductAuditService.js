module.exports = {

  createJobFeed: (jobId) => {
    return new Promise((resolve, reject) => {
      JobFeeds.create({
        job_id: jobId,
        status: "PENDING",
      }).exec(function (err, job) {
        if (err) {
          reject(err);
        } else {
          JobFeeds.update({ id: job.id }, { status: "PROCESSING" }).exec(
            function (err, updated) {
              if (err) {
                reject(err);
              } else resolve();
            }
          );
        }
      });
    });
  },

  updateJobFeed: (jobId, status) => {
    JobFeeds.update(
      {
        job_id: jobId,
      },
      { status: status }
    ).exec(function (err, job) {
      if (err) console.log("UPDATE JOB FEED ERROR", err);
    });
  },
};
