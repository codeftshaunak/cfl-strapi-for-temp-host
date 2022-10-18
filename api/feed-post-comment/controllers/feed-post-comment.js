"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async findCommentsByPostId(ctx) {
    console.log(ctx.params);
    const { id } = ctx.params;
    const entities = await strapi
      .query("feed-post-comment")
      .model.find({
        feed_post: id,
      })
      .populate({
        path: "user",
        populate: {
          path: "profile",
        },
      })
      .sort([["createdAt", "desc"]]);

    return entities;
  },
};
