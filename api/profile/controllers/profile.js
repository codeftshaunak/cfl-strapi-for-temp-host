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

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.profile })
    );
  },

  async findOne(ctx) {
    const { slug } = ctx.params;

    const entity = await strapi.services.profile.findOne({ slug });
    return sanitizeEntity(entity, { model: strapi.models.profile });
  },

  async search(ctx) {
    let entities;
    const user = ctx.state.user;

    // city: "56cc14c588b042411c0bd010"
    // premium: false
    // role: (2) ['Advisor', 'Intern']
    // skills: []
    // startupStage: []
    const params = {
      ..._.pick(ctx.query, ["_sort", "_limit", "_start"]),
      public: true,
    };

    if (user) {
      params["user"] = { $ne: user.id };
    }
    if (ctx.query.city) {
      // const city = await strapi.services.city.findOne({ id: ctx.query.city });
      // const cities = await strapi.query("city").model.find({
      //   coordinates: {
      //     $near: {
      //       $geometry: city.coordinates,
      //       $maxDistance: 100,
      //     },
      //   },
      // });
      // const countCity = strapi.services.profile.countSearch({city: ctx.query.city});
      // if(countCity > 0){
      //   params["city"] = ctx.query.city;
      // }
      params["city"] = ctx.query.city;
    }
    if (ctx.query.premium == "true") {
      params["premium"] = true;
    }
    if (ctx.query.role && ctx.query.role.length > 0) {
      params["role"] = { $in: ctx.query.role };
    }
    if (ctx.query.skills && ctx.query.skills.length > 0) {
      params["skills"] = { $in: ctx.query.skills };
    }
    if (ctx.query.startupStage && ctx.query.startupStage.length > 0) {
      params["startupStage"] = { $in: ctx.query.startupStage };
    }

    entities = await strapi.services.profile.find(params);
    // entities = await strapi.query("profile").model.find(params);

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.profile })
    );
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
    if (strapi.services.profile.okForOnboarding(entity)) {
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
