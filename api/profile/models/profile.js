"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const slugify = require("slugify");

module.exports = {
  lifecycles: {
    beforeCreate: async (data) => {
      if (data.firstName && data.lastName) {
        data.slug = slugify(
          `${data.firstName} ${data.lastName} ${Math.random()
            .toString(36)
            .slice(2)}`,
          {
            lower: true,
          }
        );
      }
    },
    beforeUpdate: async (params, data) => {
      if (data.firstName && data.lastName) {
        data.slug = slugify(
          `${data.firstName} ${data.lastName} ${Math.random()
            .toString(36)
            .slice(2)}`,
          {
            lower: true,
          }
        );
      }
    },
  },
};
