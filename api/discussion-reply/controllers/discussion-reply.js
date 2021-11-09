"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { parseMultipartData, sanitizeEntity } = require("strapi-utils");

module.exports = {
  async create(ctx) {
    let entity;
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("You must be logged in to create a post.");
    }
    if (!user.profile) {
      return ctx.unauthorized("You don't have a profile created.");
    }
    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services["discussion-reply"].create(
        { ...data, profile: user.profile.id },
        { files }
      );
    } else {
      entity = await strapi.services["discussion-reply"].create({
        ...ctx.request.body,
        profile: user.profile.id,
      });
    }
    return sanitizeEntity(entity, { model: strapi.models["discussion-reply"] });
  },

  async vote(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("You must be logged in to vote.");
    }
    if (!user.profile) {
      return ctx.unauthorized("You don't have a profile created.");
    }
    const updateObj =
      ctx.request.body.score > 0
        ? {
            $addToSet: { upvotes: user.profile.id },
            $pull: { downvotes: user.profile.id },
          }
        : {
            $addToSet: { downvotes: user.profile.id },
            $pull: { upvotes: user.profile.id },
          };
    const entity = await strapi.services["discussion-reply"].update(
      { id },
      updateObj
    );

    return sanitizeEntity(entity, { model: strapi.models["discussion-reply"] });
  },
};
