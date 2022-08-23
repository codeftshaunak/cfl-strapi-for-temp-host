'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const _ = require("lodash");
const { parseMultipartData, sanitizeEntity } = require("strapi-utils");
const sanitizeHtml = require("sanitize-html");

module.exports = {
  async findOne(ctx) {
    const { slug } = ctx.params;
    const advisor = await strapi.services["advisor-profile"].findOne({ slug });
    if (!advisor) {
      return ctx.badRequest("Advisor not found");
    }
    const profileId = advisor?.user?.profile || false;
    if(profileId){
      const profile = await strapi.query("profile").find({ id: profileId });
      delete profile[0].user;
      delete profile[0].discussions;
      delete profile[0].discussion_replies;
      delete profile[0].connections;
      advisor.user.profile = profile[0];
    }
    return sanitizeEntity(advisor, { model: strapi.models["advisor-profile"] });
  },

  async find(ctx) {
    let entities;
    const params = ctx.query;
    //params["public"] = true;
    // const user = ctx.state.user;
    // if (!user) {
    params["user"] = { $exists : true };
    // }
    // else{
    //   params["user"] = { $exists : true, $not: user._id };
    //   console.log(user);
    // }

    entities = await strapi.services["advisor-profile"].find(params);

    return entities.map((entity) => {
      return sanitizeEntity(entity, { model: strapi.models["advisor-profile"] });
    });
  },

  async count(ctx) {
    const params = ctx.query;
    params["user"] = { $exists : true };
    const count = await strapi.services["advisor-profile"].count(params);
    return count;
  },

  async update(ctx) {
    let entity;
    //get authenicated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.advisor_profile) {
      return ctx.badRequest("No advisor profile found");
    }

    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      data["user"] = user.id;
      if(ctx.request.body.summary!==undefined){
        data["summary"] = sanitizeHtml(ctx.request.body.summary);
      }
      entity = await strapi.services.profile.update(
        { user: user.profile },
        data,
        { files }
      );
    } else {
      let data = ctx.request.body;
      data["user"] = user.id;
      entity = await strapi.services["advisor-profile"].update({ id: user.advisor_profile }, data);
    }
    //return false;
    //strapi.plugins["users-permissions"].services.user.updateCRM(user, entity);
    return sanitizeEntity(entity, { model: strapi.models["advisor-profile"] });
  },
};
