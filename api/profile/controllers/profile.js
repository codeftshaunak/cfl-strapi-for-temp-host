"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const _ = require("lodash");
const { parseMultipartData, sanitizeEntity } = require("strapi-utils");
const sanitizeHtml = require("sanitize-html");

module.exports = {
  async find(ctx) {
    let entities;
    const params = ctx.query;
    params["public"] = true;
    entities = await strapi.services.profile.find(params);

    return entities.map((entity) => {
      delete entity.user;
      delete entity.discussions;
      delete entity.discussion_replies;
      delete entity.connections;
      return sanitizeEntity(entity, { model: strapi.models.profile });
    });
  },

  async findOne(ctx) {
    const { slug } = ctx.params;

    const entity = await strapi.services.profile.findOne({ slug });
    if (!entity) {
      return ctx.badRequest("profile not found");
    }
    if (!entity?.public) {
      return ctx.badRequest("profile is not public");
    }
    delete entity.user;
    delete entity.discussions;
    delete entity.discussion_replies;
    delete entity.connections;
    return sanitizeEntity(entity, { model: strapi.models.profile });
  },

  async search(ctx) {
    let entities;

    const params = strapi.services.profile.buildSearchParams(
      ctx.state.user,
      ctx.query
    );

    const { _sort, _limit, _start } = ctx.query;

    let sort = String(_sort).split(",").reduce((reducer, sort) => {
      const [sortBy, sortOrder] = sort.split(":");
      reducer[sortBy] = sortOrder === "ASC" ? 1 : -1;
      return reducer;
    }, {});
    if (ctx.query.premium?.includes("recent")) {
      sort = { lastLogin: -1, ...sort };
    }
    entities = await strapi
      .query("profile")
      .model.find(params)
      .sort(sort)
      .skip(parseInt(_start))
      .limit(parseInt(_limit));

    let connections = await strapi.services.connection.find({
      profiles: ctx.state.user.profile,
    });

    connections = connections.map((connection) =>
        sanitizeEntity(connection, { model: strapi.models.connection })
      ).map(connection => ({
        ...connection,
        profiles: connection.profiles[0].id.toString() == ctx.state.user.profile.id ? connection.profiles[1] : connection.profiles[0]
      }))

    return entities.map((entity) =>
        sanitizeEntity(entity, { model: strapi.models.profile })
      ).map(entity => {
        return {
          ...entity,
          connection: connections.find(connection => connection?.profiles?.id.toString() == entity?._id) || []
        }
      });
  },

  async count(ctx) {
    const params = strapi.services.profile.buildSearchParams(
      ctx.state.user,
      ctx.query
    );

    return strapi.query("profile").model.countDocuments(params);
  },

  async createMe(ctx) {
    let entity;
    //get authanticated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (user.profile) {
      return ctx.badRequest(
        "You already have a profile created, please updated instead."
      );
    }
    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      data["user"] = user.id;
      data["lastLogin"] = new Date();
      entity = await strapi.services.profile.create(data, { files });
    } else {
      const data = ctx.request.body;
      data["user"] = user.id;
      data["lastLogin"] = new Date();
      entity = await strapi.services.profile.create(data);
    }
    strapi.plugins["users-permissions"].services.user.updateCRM(user, entity);
    return sanitizeEntity(entity, { model: strapi.models.profile });
  },

  async findMe(ctx) {
    let entities;
    //get authenticated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    entities = await strapi.query("profile").find({ user: user.id });

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.profile })
    );
  },

  async checkConnection(ctx) {
    const { slug } = ctx.params;
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    let connections = await strapi.services.connection.find({
      profiles: ctx.state.user.profile,
    });

    let flag = false;
    let state = '';
    for(let i in connections){
      let profile = connections[i].profiles[0].id.toString() == ctx.state.user.profile.id ? connections[i].profiles[1] : connections[i].profiles[0];
      //console.log(profile)
      if(profile?.id==slug){
        flag = true;
        state = connections[i].status;
      }
    }
    return {status:flag, state};
  },

  async getConnectionList(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    let connections = await strapi.services.connection.find({
      profiles: ctx.state.user.profile,
      status: 'accepted'
    });

    connections = connections.map((connection) =>
      sanitizeEntity(connection, { model: strapi.models.connection })
    ).map(connection => {
      delete connection.authorProfile;
      delete connection.messages;
      return connection.profiles[0].id.toString() == ctx.state.user.profile.id ? connection.profiles[1] : connection.profiles[0];
    })
    return {status:true, users: connections};
  },

  async updateMe(ctx) {
    let entity;
    //get authenicated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.badRequest("No profile found");
    }

    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      data["user"] = user.id;
      if (ctx.request.body.summary !== undefined) {
        data["summary"] = sanitizeHtml(ctx.request.body.summary);
      }
      entity = await strapi.services.profile.update(
        { user: user.profile },
        data,
        { files }
      );
    } else {
      let data = ctx.request.body;
      if (ctx.request.body.summary !== undefined) {
        data = {
          ...ctx.request.body,
          summary: sanitizeHtml(ctx.request.body.summary),
        };
      }
      data["user"] = user.id;
      entity = await strapi.services.profile.update({ id: user.profile }, data);
    }

    // updating user data on updating profile anme
    await strapi.services.autoemail.update({email:user.email},{email:ctx.state.user.email,name:data.firstName});
    // update onboarded param on user if all necessary data is completed
    if (!user.onboarded && strapi.services.profile.okForOnboarding(entity)) {
      await strapi.services.profile.update(
        { id: user.profile },
        { public: true }
      );
      await strapi.query("user", "users-permissions").update(
        { id: user.id },
        {
          onboarded: true,
          onboardedAt: new Date(),
        }
      );
    }
    strapi.plugins["users-permissions"].services.user.updateCRM(user, entity);

    return sanitizeEntity(entity, { model: strapi.models.profile });
  },

  async deleteMe(ctx) {
    //get authenticated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    const entity = await strapi.services.profile.delete({ user: user.id });
    return sanitizeEntity(entity, { model: strapi.models.profile });
  },

  async recommendSearch(ctx) {
    const user = ctx.state.user;
    const { _limit, _start } = ctx.query;
    let connectedUsersId = [];

    // Finding all the connections
    const connection = await strapi.services.connection.find({
      status: { $in: ["accepted", "message"] },
      profiles: { $in: [user.profile] },
    });

    if (connection) {
      connection.forEach((item) =>
        item.profiles?.forEach((profile) => {
          if (profile.user != user._id) {
            connectedUsersId.push(profile.user);
          }
        })
      );
    }

    const params = strapi.services.profile.buildReccomendSearchParams(
      user,
      ctx.query,
      connectedUsersId
    );

    const entities = await strapi
      .query("profile")
      .model.find(params)
      .skip(parseInt(_start))
      .limit(parseInt(_limit));

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.profile })
    );
  },
};
