"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async create(ctx) {
    let entity, connection;

    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.badRequest("Not allowed.");
    }
    if (!ctx.request.body.to) {
      return ctx.badRequest("Not allowed.");
    }

    // spam filters
    if (
      strapi.services["spam-filters"].match("url").test(ctx.request.body.body)
    ) {
      return ctx.badRequest("Please remove any URLs from your message.");
    }
    if (
      strapi.services["spam-filters"].match("email").test(ctx.request.body.body)
    ) {
      return ctx.badRequest(
        "Please remove any email adresses from your message."
      );
    }
    if (
      strapi.services["spam-filters"].match("phone").test(ctx.request.body.body)
    ) {
      return ctx.badRequest(
        "Please remove any phone numbers from your message."
      );
    }

    connection = await strapi.services.connection.findOne({
      status: { $in: ["accepted", "pending", "message"]},
      profiles: { $all: [user.profile, ctx.request.body.to] },
    });
    if (!connection) {
      if (user.role.type !== "premium") {
        return ctx.unauthorized("Not allowed, Premium required.");
      } else {
        connection = await strapi.services.connection.create({
          status: "message",
          profiles: [user.profile.id, ctx.request.body.to],
          authorProfile: user.profile.id,
          updatedOn: new Date(),
        });
      }
    }

    if(ctx.request.body.body.replace(/^\s+|\s+$/gm,'')==''){
      return ctx.badRequest("Message body is empty.");
    }

    entity = await strapi.services.message.create({
      connection: connection.id,
      authorProfile: user.profile,
      body: ctx.request.body.body,
      read: false,
    });

    // marking for sort order of new messages
    await strapi.services.connection.update({
      id:connection.id,
      profiles: user.profile.id
    },{
      updatedOn: new Date(),
    });

    // recalculate badges for receiving user
    strapi.plugins.queue.services.badges.add({
      type: "messages",
      profileId: ctx.request.body.to,
    },{removeOnComplete: true});

    // send email notification
    const receivingUser = await strapi
      .query("user", "users-permissions")
      .findOne({ profile: ctx.request.body.to });
    strapi.plugins.queue.services.emails.add({
      options: {
        to: receivingUser.email,
      },
      template: {
        templateId: 4,
        sourceCodeToTemplateId: 4,
      },
      data: {
        toProfile: connection.profiles.filter(
          (p) => p.id !== user.profile.id
        )[0],
        fromProfile: connection.profiles.filter(
          (p) => p.id === user.profile.id
        )[0],
      },
    },{removeOnComplete: true});
    
    // send system notification
    await strapi.services.notification.create({
      action: "messaged",
      userSender: user,
      userReceiver: ctx.request.body.toUser,
      references: {
        connectionId: connection.id,
      },
    });

    return sanitizeEntity(entity, { model: strapi.models.message });
  },
};
