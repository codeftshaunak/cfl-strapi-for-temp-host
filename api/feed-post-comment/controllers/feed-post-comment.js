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

  async create(ctx) {
    const { body } = ctx.request;

    const { user: userSender, feed_post } = body;

    let entity;

    entity = await strapi.services["feed-post-comment"].create(body);

    // creating notification
    strapi.services["feed-post"].findById(feed_post).then((post) => {
      const { user: userReceiver } = post;

      strapi.services.notification.create({
        action: "commented",
        userSender,
        userReceiver,
        references: {
          postId: feed_post,
          commentId: entity._id,
        },
      });
    });

    return sanitizeEntity(entity, {
      model: strapi.models["feed-post-comment"],
    });
  },
};
