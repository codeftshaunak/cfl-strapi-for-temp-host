"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { parseMultipartData, sanitizeEntity } = require("strapi-utils");

module.exports = {
  async findOne(ctx) {
    const { id } = ctx.params;

    const course = sanitizeEntity(
      await strapi.query("course").model.findOne({ _id: id }),
      { model: strapi.models.course }
    );

    const modules = sanitizeEntity(
      await strapi.services["course-content"].find({ course: id }),
      { model: strapi.models["course-content"] }
    );

    return { ...course, modules };
  },
};
