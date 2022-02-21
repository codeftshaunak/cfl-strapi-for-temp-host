"use strict";

// queue that email sending

const Queue = require("bull");
const opts = require("../config/connection");

const emailsQueue = new Queue("emails", opts);

emailsQueue.process(async (job, done) => {
  await strapi.plugins["email-designer"].services.email.sendTemplatedEmail(
    job.data.options,
    job.data.template,
    job.data.data
  );
  done();
});

module.exports = emailsQueue;
