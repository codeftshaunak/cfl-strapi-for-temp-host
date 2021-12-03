"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const _ = require("lodash");
const { parseMultipartData, sanitizeEntity } = require("strapi-utils");

module.exports = {
  async find(ctx) {
    let entities;
    const params = ctx.query;
    params["public"] = true;
    entities = await strapi.services.profile.find(params);

    return entities.map((entity) => {
      delete entity.user;
      delete entity.discussions;
      delete entity.discussion_replies;
      delete entity.connections;
      return sanitizeEntity(entity, { model: strapi.models.profile });
    });
  },

  async findOne(ctx) {
    const { slug } = ctx.params;

    const entity = await strapi.services.profile.findOne({ slug });
    delete entity.user;
    delete entity.discussions;
    delete entity.discussion_replies;
    delete entity.connections;
    return sanitizeEntity(entity, { model: strapi.models.profile });
  },

  async search(ctx) {
    let entities;

    const params = strapi.services.profile.buildSearchParams(
      ctx.state.user,
      ctx.query
    );

    // entities = await strapi.services.profile.find(params);

    const { _sort, _limit, _start } = ctx.query;
    const sort = _sort.split(",").reduce((reducer, sort) => {
      const [sortBy, sortOrder] = sort.split(":");
      reducer[sortBy] = sortOrder === "ASC" ? 1 : -1;
    }, {});
    entities = await strapi
      .query("profile")
      .model.find(params)
      .sort(sort)
      .skip(parseInt(_start))
      .limit(parseInt(_limit));

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.profile })
    );
  },

  async count(ctx) {
    const params = strapi.services.profile.buildSearchParams(
      ctx.state.user,
      ctx.query
    );

    return strapi.query("profile").model.count(params);
  },

  async createMe(ctx) {
    let entity;
    //get authanticated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (user.profile) {
      return ctx.badRequest(
        "You already have a profile created, please updated instead."
      );
    }
    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      data["user"] = user.id;
      entity = await strapi.services.profile.create(data, { files });
    } else {
      const data = ctx.request.body;
      data["user"] = user.id;
      entity = await strapi.services.profile.create(data);
    }
    return sanitizeEntity(entity, { model: strapi.models.profile });
  },

  async findMe(ctx) {
    let entities;
    //get authenticated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    entities = await strapi.query("profile").find({ user: user.id });

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.profile })
    );
  },

  async updateMe(ctx) {
    let entity;
    //get authenicated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.badRequest("No profile found");
    }
    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      data["user"] = user.id;
      entity = await strapi.services.profile.update(
        { user: user.profile },
        data,
        { files }
      );
    } else {
      const data = ctx.request.body;
      data["user"] = user.id;
      entity = await strapi.services.profile.update({ id: user.profile }, data);
    }

    // update onboarded param on user if all necessary data is completed
    if (!user.onboarded && strapi.services.profile.okForOnboarding(entity)) {
      await strapi.services.profile.update(
        { id: user.profile },
        { public: true }
      );
      await strapi.query("user", "users-permissions").update(
        { id: user.id },
        {
          onboarded: true,
          onboardedAt: new Date(),
        }
      );
    }

    return sanitizeEntity(entity, { model: strapi.models.profile });
  },

  async deleteMe(ctx) {
    //get authenticated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    const entity = await strapi.services.profile.delete({ user: user.id });
    return sanitizeEntity(entity, { model: strapi.models.profile });
  },
};
