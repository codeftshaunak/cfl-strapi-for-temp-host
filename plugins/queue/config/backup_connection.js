"use strict";

const { env } = require("strapi-utils");
const Redis = require("ioredis");

let client;
let subscriber;

const opts = {
  // redisOpts here will contain at least a property of connectionName which will identify the queue based on its name
  createClient: function (type, redisOpts) {
    switch (type) {
      case "client":
        if (!client) {
          client = new Redis(env("REDIS_URL"), {
            ...redisOpts,
            tls: {
              rejectUnauthorized: false,
            },
          });
        }
        return client;
      case "subscriber":
        if (!subscriber) {
          subscriber = new Redis(env("REDIS_URL"), {
            ...redisOpts,
            tls: {
              rejectUnauthorized: false,
            },
          });
        }
        return subscriber;
      case "bclient":
        return new Redis(env("REDIS_URL"), {
          ...redisOpts,
          tls: {
            rejectUnauthorized: false,
          },
        });
      default:
        throw new Error("Unexpected connection type: ", type);
    }
  },
};

module.exports = opts;
