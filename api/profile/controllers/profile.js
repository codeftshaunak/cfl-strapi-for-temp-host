"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

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

  async search(ctx) {
    let entities;
    const params = {
      public: true,
    };

    // city: "56cc14c588b042411c0bd010"
    // premium: false
    // role: (2) ['Advisor', 'Intern']
    // skills: []
    // startupStage: []
    const data = ctx.query;
    console.log("profile.js data", data);

    if (data.city) {
      // const city = await strapi.services.city.findOne({ id: data.city });
      // const cities = await strapi.query("city").model.find({
      //   coordinates: {
      //     $near: {
      //       $geometry: city.coordinates,
      //       $maxDistance: 100,
      //     },
      //   },
      // });
      params["city"] = data.city;
    }
    if (data.premium == "true") {
      params["premium"] = true;
    }
    if (data.role && data.role.length > 0) {
      params["role"] = { $in: data.role };
    }
    if (data.skills && data.skills.length > 0) {
      params["skills"] = { $in: data.skills };
    }
    if (data.startupStage && data.startupStage.length > 0) {
      params["startupStage"] = { $in: data.startupStage };
    }

    entities = await strapi.query("profile").model.find(params);

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
