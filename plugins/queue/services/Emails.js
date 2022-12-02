"use strict";

// queue that email sending

const Queue = require("bull");
const opts = require("../config/connection");

const emailsQueue = new Queue("emails", opts);

emailsQueue.process(async (job, done) => {
    try{
      strapi.plugins["email-designer"].services["email"].sendTemplatedEmail(
        job.data.options,
        job.data.template,
        job.data.data
      );
      emailsQueue.close();
      done();
    }catch(e){
      console.log("error while sending connection email ",e.message);
    }
});

module.exports = emailsQueue;
