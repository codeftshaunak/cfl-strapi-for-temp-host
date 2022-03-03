"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async connect(ctx) {
    let entity;
    //get authanticated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }

    const data = ctx.request.body;

    const connection = await strapi.services.connection.findOne({
      profiles: { $all: [user.profile, data.profile] },
    });
    if (connection) {
      return ctx.badRequest(
        `You already have a connection with this person. Status: ${connection.status}`
      );
    }

    // spam filters
    if (strapi.services["spam-filters"].match("url").test(data.message)) {
      return ctx.badRequest("Please remove any URLs from your message.");
    }
    if (strapi.services["spam-filters"].match("email").test(data.message)) {
      return ctx.badRequest(
        "Please remove any email adresses from your message."
      );
    }
    if (strapi.services["spam-filters"].match("phone").test(data.message)) {
      return ctx.badRequest(
        "Please remove any phone numbers from your message."
      );
    }

    data["authorProfile"] = user.profile;
    data["profiles"] = [user.profile, data.profile];
    data["status"] = "pending";
    entity = await strapi.services.connection.create(data);

    strapi.plugins.queue.services.badges.add({
      type: "connections",
      profileId: data.profile,
    });

    return sanitizeEntity(entity, { model: strapi.models.connection });
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    //get authenticated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.unauthorized("No profile created.");
    }
    const query = { id, profiles: user.profile.id };

    const entity = await strapi.services.connection.findOne(query);
    return sanitizeEntity(entity, { model: strapi.models.connection });
  },

  async findMe(ctx) {
    let entities;
    //get authenticated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.unauthorized("No profile created.");
    }
    const query = ctx.query;
    query["profiles"] = user.profile.id;
    entities = await strapi.query("connection").find(query);

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.connection })
    );
  },

  async accept(ctx) {
    const { id } = ctx.params;
    let entity;
    //get authenicated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.unauthorized("No profile created.");
    }
    entity = await strapi.services.connection.update(
      { id, profiles: user.profile.id },
      {
        status: "accepted",
      }
    );

    strapi.plugins.queue.services.badges.add({
      type: "connections",
      profileId: user.profile.id,
    });

    return sanitizeEntity(entity, { model: strapi.models.connection });
  },

  async ignore(ctx) {
    const { id } = ctx.params;
    let entity;
    //get authenicated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.unauthorized("No profile created.");
    }
    entity = await strapi.services.connection.update(
      { id, profiles: user.profile.id },
      {
        status: "ignored",
      }
    );

    strapi.plugins.queue.services.badges.add({
      type: "connections",
      profileId: user.profile.id,
    });

    return sanitizeEntity(entity, { model: strapi.models.connection });
  },

  async markRead(ctx) {
    const { id } = ctx.params;

    //get authenicated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.unauthorized("No profile created.");
    }
    try {
      await strapi.query("message").model.updateMany(
        {
          connection: id,
          authorProfile: { $ne: user.profile.id },
          readAt: null,
        },
        {
          read: true,
          readAt: new Date(),
        }
      );

      strapi.plugins.queue.services.badges.add({
        type: "messages",
        profileId: user.profile.id,
      });
    } catch (e) {}

    return { ok: true };
  },
};
