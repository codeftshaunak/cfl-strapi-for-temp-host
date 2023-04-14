"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async findByUser(ctx) {
    const user = ctx.state.user;

    return strapi
      .query("notification")
      .model.find({ userReceiver: user })
      .populate({
        path: "userSender",
        populate: {
          path: "profile",
        },
      })
      .sort({ createdAt: "desc" })
      .lean();
  },

  async unSeenNotificationCount(ctx) {
    const { user } = ctx.state;

    return strapi.query("notification").model.count({
      $or: [{ isSeen: { $exists: false } }, { isSeen: false }],
      userReceiver: user._id,
    });
  },

  async updateNotificationSeen(ctx) {
    const { id } = ctx.params;

    let updatedEntity;
    if (id) {
      const entity = await strapi.services.notification.findOne({ id });

      if (entity) {
        updatedEntity = await strapi.services.notification.update(
          { id },
          { isSeen: true }
        );
      }
    }

    return sanitizeEntity(updatedEntity, {
      model: strapi.models.notification,
    });
  },

  async updateNotificationsSeen(ctx) {
    const user = ctx.state.user;

    const updatedEntity = await strapi.query("notification").model.updateMany(
      {
        userReceiver: user
      },
      { 
        isSeen: true
      }
    );

    return sanitizeEntity(updatedEntity, {
      model: strapi.models.notification,
    });
  },

  async createEmailSystem(ctx) {
    const user = ctx.state.user;
    const { to, toUser } = ctx.request.body;

    // validations
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.badRequest("Not allowed.");
    }
    if (!to) {
      return ctx.badRequest("Not allowed.");
    }
    if (user.role.type !== "premium") {
      return ctx.unauthorized("Not allowed, Premium required.");
    } 

    let connection = await strapi.services.connection.findOne({
      status: { $in: ["accepted", "pending", "message"]},
      profiles: { $all: [user.profile, to] },
    });

    if (!connection) {
      connection = await strapi.services.connection.create({
        status: "message",
        profiles: [user.profile.id, to],
        authorProfile: user.profile.id,
        updatedOn: new Date(),
      });
    }
    
    // marking for sort order of new messages
    await strapi.services.connection.update({
      id: connection.id,
      profiles: user.profile.id
    },{
      updatedOn: new Date(),
    });

    // send email notification
    const receivingUser = await strapi
      .query("user", "users-permissions")
      .findOne({ profile: to });

    try{
      await strapi.plugins["email-designer"].services["email"].sendTemplatedEmail(
        {
          to: receivingUser.email
        },
        {
          templateId: 4,
          sourceCodeToTemplateId: 4,
        },
        {
          toProfile: connection.profiles.filter((p) => p.id !== user.profile.id)[0],
          fromProfile: connection.profiles.filter((p) => p.id === user.profile.id)[0],
        }
      );
    } catch(e) {
      console.log("error while sending message email ",e.message);
    }
    
    // strapi.plugins.queue.services.emails.add({
    //   options: {
    //     to: receivingUser.email,
    //   },
    //   template: {
    //     templateId: 4,
    //     sourceCodeToTemplateId: 4,
    //   },
    //   data: {
    //     toProfile: connection.profiles.filter(
    //       (p) => p.id !== user.profile.id
    //     )[0],
    //     fromProfile: connection.profiles.filter(
    //       (p) => p.id === user.profile.id
    //     )[0],
    //   },
    // },{ removeOnComplete: true });

    // send system notification
    await strapi.services.notification.create({
      action: "messaged",
      userSender: user,
      userReceiver: toUser,
      references: {
        connectionId: connection.id,
      },
    });

    return { ok: true };
  },
};
