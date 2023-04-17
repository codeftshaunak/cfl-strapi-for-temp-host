"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async connect(ctx) {
    let entity;
    //get authanticated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }

    const data = ctx.request.body;
    
    if(typeof data.profile != 'string'){
      // Admin profile id which connect with everyone automatically
      data.profile = strapi.config.get("server.admin_profile_id"); 

      data.message = "Welcome!";
    }



    if (data.message.replace(/^\s+|\s+$/gm, "") == "") {
      return ctx.badRequest("Message body is empty.");
    }

    const connection = await strapi.services.connection.findOne({
      profiles: { $all: [user.profile, data.profile] },
    });

    if (connection && connection.status !== "message") {
      return ctx.badRequest(
        `You already have a connection with this person. Status: ${connection.status}`
      );
    }

    // spam filters
    if (strapi.services["spam-filters"].match("url").test(data.message)) {
      return ctx.badRequest("Please remove any URLs from your message.");
    }
    if (strapi.services["spam-filters"].match("email").test(data.message)) {
      return ctx.badRequest(
        "Please remove any email adresses from your message."
      );
    }
    if (strapi.services["spam-filters"].match("phone").test(data.message)) {
      return ctx.badRequest(
        "Please remove any phone numbers from your message."
      );
    }

    // updating if chatting already
    if (connection) {
      entity = await strapi.services.connection.update(
        {
          id: connection.id,
          profiles: user.profile.id,
        },
        {
          authorProfile: user.profile,
          message: data.message,
          status: "pending",
        }
      );
    } else {
      let newConnection;

      if(data.profile == strapi.config.get("server.admin_profile_id")){
        newConnection = {
          authorProfile: data.profile,
          profiles: [data.profile, user.profile.id],
          status: "accepted",
          message: data.message,
          updatedOn: new Date(),
        };
      }else {
        newConnection = {
          authorProfile: user.profile.id,
          profiles: [user.profile.id, data.profile],
          status: "pending",
          message: data.message,
        };
      }
      entity = await strapi.services.connection.create(newConnection);
    }
    // if(typeof data.profile == 'string'){
    //   console.log('id is', id);
    //   console.log("user.profile.id", user.profile.id);
    //   entity = await strapi.services.connection.update(
    //     { id, profiles: user.profile.id },
    //     {
    //       status: "accepted",
    //       updatedOn: new Date(),
    //     }
    //   );
    //   console.log('updated');
    // }


    await strapi.plugins["users-permissions"].services.user.calculateConnections(data.profile);
    // strapi.plugins.queue.services.badges.add(
    //   {
    //     type: "connections",
    //     profileId: data.profile,
    //   },
    //   { removeOnComplete: true }
    // );

    // creating notification


    strapi.services.profile.findById(data.profile).then(async (profile) => {
      await strapi.services.notification.create({
        action: "connectionRequest",
        userSender: user._id,
        userReceiver: profile.user._id,
        references: {},
      });

      try{
        await strapi.plugins["email-designer"].services["email"].sendTemplatedEmail(
          {to:profile.user.email},
          {
            templateId: 6,
            sourceCodeToTemplateId: 6,
          },
          {
            toProfile: profile,
            fromProfile: user.profile,
          }
        );
      }catch(e){
        console.log("error while sending connection email ",e.message);
      }

      // email notification
      // strapi.plugins.queue.services.emails.add(
      //   {
      //     options: {
      //       to: profile.user.email,
      //     },
      //     template: {
      //       templateId: 6,
      //       sourceCodeToTemplateId: 6,
      //     },
      //     data: {
      //       toProfile: profile,
      //       fromProfile: user.profile,
      //     },
      //   },
      //   { removeOnComplete: true }
      // );
      //console.log('check status ', profile ,user.profile);

      // code added by mohammad, its causing issue I am commenting it as its changing the connection data, Roop on 30-12-2022
      // await strapi.services.profile.update(
      //   {
      //     id: profile.id,
      //   },
      //   {
      //     connections: [entity],
      //   }
      // );
    });

    return sanitizeEntity(entity, { model: strapi.models.connection });
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    //get authenticated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.unauthorized("No profile created.");
    }
    const query = { id, profiles: user.profile.id };

    const entity = await strapi.services.connection.findOne(query);
    return sanitizeEntity(entity, { model: strapi.models.connection });
  },

  async findMe(ctx) {
    let entities;
    //get authenticated user details
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.unauthorized("No profile created.");
    }

    const query = ctx.query;
    
    if (ctx.query?.authorProfile) {
      query["authorProfile"] = {
        $ne: ctx.query.authorProfile
      };
    }

    if (ctx.query?.profiles) {
      query["authorProfile"] = user.profile.id;
    }

    query["profiles"] = user.profile.id;

    entities = await strapi.query("connection").find(query);

    return entities.map((entity) => {
      //delete entity.messages;
      return sanitizeEntity(entity, { model: strapi.models.connection });
    });
    // return entities.map((entity) =>
    //   sanitizeEntity(entity, { model: strapi.models.connection })
    // );
  },

  async findMeMessages(ctx) {
    let entities;
    //get authenticated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.unauthorized("No profile created.");
    }
    const query = ctx.query;
    query["profiles"] = user.profile.id;
    entities = await strapi.query("connection").find(query);

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.connection })
    );
  },

  async accept(ctx) {
    const { id } = ctx.params;
    let entity;
    //get authenicated user details
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.unauthorized("No profile created.");
    }
    entity = await strapi.services.connection.update(
      { id, profiles: user.profile.id },
      {
        status: "accepted",
        updatedOn: new Date(),
      }
    );

    await strapi.plugins["users-permissions"].services.user.calculateConnections(user.profile.id);
    // strapi.plugins.queue.services.badges.add(
    //   {
    //     type: "connections",
    //     profileId: user.profile.id,
    //   },
    //   { removeOnComplete: true }
    // );

    return sanitizeEntity(entity, { model: strapi.models.connection });
  },

  async delete(ctx) {
    const { id } = ctx.params;
    let entity;
    //get authenicated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    // changing to message status to keep the chat and connection alive
    entity = await strapi.services.connection.update(
      { id, profiles: user.profile.id },
      {
        status: "message",
      }
    );

    return sanitizeEntity(entity, { model: strapi.models.connection });
  },

  async ignore(ctx) {
    const { id } = ctx.params;
    let entity;
    //get authenicated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.unauthorized("No profile created.");
    }
    entity = await strapi.services.connection.update(
      { id, profiles: user.profile.id },
      {
        status: "ignored",
      }
    );

    await strapi.plugins["users-permissions"].services.user.calculateConnections(user.profile.id);

    // strapi.plugins.queue.services.badges.add(
    //   {
    //     type: "connections",
    //     profileId: user.profile.id,
    //   },
    //   { removeOnComplete: true }
    // );

    return sanitizeEntity(entity, { model: strapi.models.connection });
  },

  async markRead(ctx) {
    const { id } = ctx.params;

    //get authenicated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.unauthorized("No profile created.");
    }
    try {
      await strapi.query("message").model.updateMany(
        {
          connection: id,
          authorProfile: { $ne: user.profile.id },
          readAt: null,
        },
        {
          read: true,
          readAt: new Date(),
        }
      );
      await strapi.plugins["users-permissions"].services.user.calculateMessages(user.profile.id);

      // strapi.plugins.queue.services.badges.add(
      //   {
      //     type: "messages",
      //     profileId: user.profile.id,
      //   },
      //   { removeOnComplete: true }
      // );
    } catch (e) {}

    return { ok: true };
  },
};
