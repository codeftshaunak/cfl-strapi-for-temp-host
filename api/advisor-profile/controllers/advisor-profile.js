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
    const { slug, user } = ctx.params;
    console.log(user);
    const advisor = await strapi.services["advisor-profile"].findOne({ slug });
    if (!advisor) {
      return ctx.badRequest("Advisor not found");
    }
    const profileId = advisor.user.profile;
    const profile = await strapi.query("profile").find({ id: profileId });
    delete profile[0].user;
    delete profile[0].discussions;
    delete profile[0].discussion_replies;
    delete profile[0].connections;
    advisor.user.profile = profile[0];
    // delete entity.user;
    // delete entity.discussions;
    // delete entity.discussion_replies;
    // delete entity.connections;
    return sanitizeEntity(advisor, { model: strapi.models["advisor-profile"] });
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

    console.log(user);

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
      // if(ctx.request.body.summary!==undefined){
      //   data = {
      //     ...ctx.request.body,
      //     summary: sanitizeHtml(ctx.request.body.summary),
      //   };
      // }
      data["user"] = user.id;
      entity = await strapi.services["advisor-profile"].update({ id: user.advisor_profile }, data);
    }
    return false;

    strapi.plugins["users-permissions"].services.user.updateCRM(user, entity);

    return sanitizeEntity(entity, { model: strapi.models.profile });
  },
};
