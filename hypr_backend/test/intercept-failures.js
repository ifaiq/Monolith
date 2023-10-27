/* eslint-disable no-process-exit */
/* eslint-disable no-console */
const sails = require("sails");
const failures = [];

// Before running any test
before(done => {
  sails.lift(
    {
      hooks: { grunt: false },
      log: { level: "warn" },
    },
    err => {
      if (err) {
        process.exit(5);
      }
      done();
    },
  );
});

afterEach(function () {
  const title = this.currentTest.title;
  const state = this.currentTest.state;
  if (state === "failed") {
    failures.push(title);
  }
});

after(done => {
  sails.lower({}, err => {
    if (err) {
      sails.log("An error occurred while shutting the server down.");
      done(err);
    }
  });

  if (failures && failures.length === 0) {
    process.exit();
  }

  setTimeout(() => {
    process.exit(5);
  }, 10000);
});
