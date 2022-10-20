"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity, parseMultipartData } = require("strapi-utils");

module.exports = {
  async find(ctx) {
    let entities;

    entities = await strapi
      .query("feed-post")
      .model.find()
      .populate({
        path: "user",
        select: ["email"],
        populate: {
          path: "profile",
          select: ["firstName", "lastName"],
        },
      })
      .populate({
        path: "comments",
      })
      .lean()
      .sort([["createdAt", "desc"]]);

    return entities.map((entity) => {
      const commentsCount = entity.comments.length;
      delete entity.comments;
      return {
        ...entity,
        commentsCount,
      };
    });
  },

  async create(ctx) {
    const user = ctx.state.user;
    const data = ctx.request.body;
    const entity = await strapi.services["feed-post"].create({
      ...data,
      user: user.id,
    });

    return sanitizeEntity(entity, { model: strapi.models["feed-post"] });
  },

  async likeByUser(ctx) {
    try {
      const user = ctx.state.user;
      const { likedByUser } = ctx.request.body;

      const { id } = ctx.params;

      const entity = await strapi.query("feed-post").model.findById(id).lean();

      if (likedByUser) {
        entity.liked_by_users.push(user.id);
      } else {
        const { liked_by_users } = entity;

        const index = liked_by_users.findIndex(
          (userId) => userId.toString() === user.id
        );

        if (index > -1) {
          entity.liked_by_users.splice(index, 1);
        }
      }

      await strapi
        .query("feed-post")
        .update({ id }, { liked_by_users: entity.liked_by_users });

      return entity.liked_by_users;
    } catch (err) {
      console.log("err", err);
      return err;
    }
  },
};
