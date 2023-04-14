"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async create(ctx) {
    const user = ctx.state.user;
    const { to, body } = ctx.request.body;
    let { connectionId } = ctx.request.body;

    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.badRequest("Not allowed.");
    }
    if (!to) {
      return ctx.badRequest("Not allowed.");
    }

    // spam filters
    if(body.replace(/^\s+|\s+$/gm,'') == ''){
      return ctx.badRequest("Message body is empty.");
    }
    if (
      strapi.services["spam-filters"].match("url").test(body)
    ) {
      return ctx.badRequest("Please remove any URLs from your message.");
    }
    if (
      strapi.services["spam-filters"].match("email").test(body)
    ) {
      return ctx.badRequest(
        "Please remove any email adresses from your message."
      );
    }
    if (
      strapi.services["spam-filters"].match("phone").test(body)
    ) {
      return ctx.badRequest(
        "Please remove any phone numbers from your message."
      );
    }

    if (!connectionId) {
      let connection = await strapi.services.connection.findOne({
        status: { $in: ["accepted", "pending", "message"]},
        profiles: { $all: [user.profile, to] },
      });
      
      if (!connection) {
        if (user.role.type !== "premium") {
          return ctx.unauthorized("Not allowed, Premium required.");
        }
        connection = await strapi.services.connection.create({
          status: "message",
          profiles: [user.profile.id, to],
          authorProfile: user.profile.id,
          updatedOn: new Date(),
        });
      }
      connectionId = connection.id;
    }

    const entity = await strapi.services.message.create({
      connection: connectionId,
      authorProfile: user.profile,
      body,
      read: false,
    });

    return sanitizeEntity(entity, { model: strapi.models.message });
  },

  async testEmail(ctx) {
    try{
      await strapi.plugins["email-designer"].services["email"].sendTemplatedEmail(
        {to:"kartique79@gmail.com"},
        {
          templateId: 9,
          sourceCodeToTemplateId: 9,
        },
        {}
      );
    }catch(e){
      console.log("error while sending test email ",e.message);
    }
    // try{
    //   strapi.plugins.queue.services.emails.add({
    //     options: {
    //       to: 'kartique79@gmail.com',
    //     },
    //     template: {
    //       templateId: '61f51089bcb43958aaed0889',
    //       sourceCodeToTemplateId: 2,
    //     },
    //     data: {
    //       url: "https://cofounderslab.com",
    //       token: "RoopKumar",
    //     },
    //   },{removeOnComplete: true});
    // }catch(e){
    //   console.log(e);
    // }
    return "ok";
  }
};
