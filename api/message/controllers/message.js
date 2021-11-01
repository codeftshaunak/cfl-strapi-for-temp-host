"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async create(ctx) {
    let entity, connection;

    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.badRequest("No profile found.");
    }
    if (!ctx.request.body.to) {
      return ctx.badRequest("Invalid receiver.");
    }
    connection = await strapi.services.connection.findOne({
      status: "accepted",
      profiles: { $all: [user.profile, ctx.request.body.to] },
    });
    if (!connection) {
      if (user.role.type !== "premium") {
        return ctx.unauthorized("Not allowed");
      } else {
        connection = await strapi.services.connection.create({
          status: "accepted",
          profiles: [user.profile.id, ctx.request.body.to],
          authorProfile: user.profile.id,
        });
      }
    }
    entity = await strapi.services.message.create({
      connection: connection.id,
      authorProfile: user.profile,
      body: ctx.request.body.body,
    });

    return sanitizeEntity(entity, { model: strapi.models.message });
  },
};
