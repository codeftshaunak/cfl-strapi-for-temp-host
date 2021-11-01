"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async create(ctx) {
    let entity;

    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.badRequest("No profile found.");
    }
    if (!data.to) {
      return ctx.badRequest("Invalid receiver.");
    }
    const connection = await strapi.services.connection.findOne({
      profiles: { $all: [user.profile, data.to] },
    });
    if (!connection) {
      return ctx.unauthorized("Not allowed");
    }
    const data = ctx.request.body;
    data["connection"] = connection.id;
    data["authorProfile"] = user.profile;
    entity = await strapi.services.profile.create(data);

    return sanitizeEntity(entity, { model: strapi.models.profile });
  },
};
