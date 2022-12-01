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
          select: ["firstName", "lastName", "role", "tagline"],
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

  async findOne(ctx) {
    let entity;

    const { id } = ctx.params;

    if (id) {
      entity = strapi
        .query("feed-post")
        .model.findOne({ _id: id })
        .populate({
          path: "user",
          populate: {
            path: "profile",
          },
        });
    }

    return entity;
  },

  async create(ctx) {
    const user = ctx.state.user;
    const data = ctx.request.body;
    const entity = await strapi.services["feed-post"].create({
      ...data,
      user: user.id,
    });

    // Finding all the connections
    const connection = await strapi.services.connection.find({
        status: { $in: ["accepted", "message"]},
        authorProfile: { $in: [user.profile ] },
      });

    if (connection) {
      let connectedUsersId = [];

      connection.forEach(item => item.profiles?.forEach(profile => {
        console.log(profile.user, user._id)
        console.log(profile.user != user._id)
        if (profile.user != user._id) {
          connectedUsersId.push(profile.user);
        };
      }));

      connectedUsersId.forEach(async connectedUserId => {
        // send notification
        await strapi.services.notification.create({
          action: "posted",
          userSender: user,
          userReceiver: connectedUserId,
          references: {
            postId: entity._id,
          },
        });
      })
    }

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

      if (likedByUser) {
        await strapi.services.notification.create({
          action: "liked",
          userSender: user,
          userReceiver: entity.user._id,
          references: {
            postId: entity._id,
          },
        });
      }

      return entity.liked_by_users;
    } catch (err) {
      console.log("err", err);
      return err;
    }
  },
};