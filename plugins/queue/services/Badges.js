"use strict";

// queue that handles badge counts

const Queue = require("bull");
const opts = require("../config/connection");

const badgesQueue = new Queue("badges", opts);

badgesQueue.process(async (job, done) => {
  switch (job.data.type) {
    case "connections":
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

      break;

    case "messages":
      if (job.data.profileId) {
        try {
          const connections = await strapi.query("connection").find({
            profiles: job.data.profileId,
            status: "accepted",
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

          done();
        } catch (error) {
          done(new Error("failed", error));
        }
      }
      done(new Error("no profileId"));
      break;
    default:
      done(new Error("unexpected job type"));
  }
  done(new Error("should not get here"));
});

module.exports = badgesQueue;
