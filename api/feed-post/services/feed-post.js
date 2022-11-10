"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  findById(id) {
    return strapi.query("feed-post").findOne({ _id: id });
  },
};
