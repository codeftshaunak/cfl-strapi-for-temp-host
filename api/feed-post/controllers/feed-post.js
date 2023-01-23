"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity, parseMultipartData } = require("strapi-utils");

module.exports = {
  async find(ctx) {
    const query = ctx.query;
    const user = query.user_id;
    const params = {
      group: query.group,
    };

    if (params.group) {
      if (!user) {
        return ctx.unauthorized("You must be logged in to see this.");
      }
      const isMember = await strapi.query("group").findOne({ id: params.group, users_permissions_users: user });
      if (!isMember) {
        return ctx.unauthorized("You are not part of the group.");
      }
    }

    const entities = await strapi
      .query("feed-post")
      .model.find(params)
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
      .populate({
        path: "user",
        populate: {
          path: "profile",
        },
      })
      .populate({
        path: "poll",
        populate: {
          path: "poll_options",
        },
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
        })
        .populate({
          path: "poll",
          populate: {
            path: "poll_options",
          },
        });
    }

    return entity;
  },

  async create(ctx) {
    const user = ctx.state.user;
    const data = ctx.request.body;
    const { poll, text } = data;

    const ids = await Promise.all(
      poll.options.map(async (option) => {
        const opt = await strapi.services["poll-option"].create({
          text: option.value,
        });

        return opt._id.toString();
      })
    );

    const createdPoll = await strapi.services["polls"].create({
      text: poll.text,
      poll_options: ids,
    });
    const anchorText = await strapi.services["feed-post"].getAchorText(text);
    const entity = await strapi.services["feed-post"].create({
      ...data,
      text: anchorText,
      user: user.id,
      poll: createdPoll._id,
    });

    // Finding all the connections
    const connection = await strapi.services.connection.find({
      status: { $in: ["accepted", "message"] },
      profiles: { $in: [user.profile] },
    });

    if (connection) {
      let connectedUsersId = [];

      connection.forEach((item) =>
        item.profiles?.forEach((profile) => {
          if (profile.user != user._id) {
            connectedUsersId.push(profile.user);
          }
        })
      );

      connectedUsersId.forEach(async (connectedUserId) => {
        // send notification
        await strapi.services.notification.create({
          action: "posted",
          userSender: user,
          userReceiver: connectedUserId,
          references: {
            postId: entity._id,
          },
        });
      });
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
