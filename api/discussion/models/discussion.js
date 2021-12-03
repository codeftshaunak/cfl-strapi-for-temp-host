"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const slugify = require("slugify");

module.exports = {
  lifecycles: {
    beforeCreate: async (data) => {
      if (data.title && !data.slug) {
        data.slug = slugify(
          `${data.title} ${Math.random().toString(36).slice(2)}`,
          {
            lower: true,
          }
        );
      }
      if (!data.upvotes) {
        data.upvotes = [];
      }
      if (!data.downvotes) {
        data.downvotes = [];
      }
    },
    beforeUpdate: async (params, data) => {
      if (data.title && !data.slug) {
        data.slug = slugify(
          `${data.title} ${Math.random().toString(36).slice(2)}`,
          {
            lower: true,
          }
        );
      }
    },
  },
};
