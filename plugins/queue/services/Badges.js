"use strict";

// queue that handles badge counts

const Queue = require("bull");
const opts = require("../config/connection");

const badgesQueue = new Queue("badges", opts);

badgesQueue.process(async (job, done) => {
  switch (job.data.type) {
    case "connections":
      try{
        const count = await strapi.query("connection").count({
          profiles: job.data.profileId,
          authorProfile_ne: job.data.profileId,
          status: "pending",
          _limit: -1,
        });
        await strapi
          .query("user", "users-permissions")
          .model.updateOne(
            { profile: job.data.profileId },
            { $set: { "badges.pendingConnections": count } }
        );
        badgesQueue.close();
        done();
      }catch(e){
        console.log('updating count in badges.js---------------------------',e.message);
      }

      break;

    case "messages":
      if (job.data.profileId) {
        try {
          const connections = await strapi.query("connection").find({
            profiles: job.data.profileId,
            status: { $in: ["accepted", "pending", "message"]},
            _limit: -1,
          });

          const connectionsIds = connections.map((connection) => connection.id);

          const count = await strapi.query("message").count({
            connection_in: connectionsIds,
            authorProfile_ne: job.data.profileId,
            read: false,
          });

          await strapi
            .query("user", "users-permissions")
            .model.updateOne(
              { profile: job.data.profileId },
              { $set: { "badges.unreadMessages": count } }
            );

          badgesQueue.close();
          done();
        } catch (error) {
          console.log("failed updating unread message count ----------------", error);
          done(new Error("failed updating unread message count ----------------", error));
        }
      }
      console.log("no profile id ------------------------------");
      done(new Error("no profileId"));
      break;
    default:
      console.log("Unexpected job type ------------------------------");
      done(new Error("unexpected job type"));
  }
  console.log("should not get here ------------------------------");
  done(new Error("should not get here"));
});

module.exports = badgesQueue;
