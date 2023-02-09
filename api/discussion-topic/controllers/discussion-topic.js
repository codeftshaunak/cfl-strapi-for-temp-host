'use strict';

const { sanitizeEntity } = require("strapi-utils/lib");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async findTrending(ctx) {
        let entities;
        const params = ctx.query;
        entities = await strapi.services["discussion-topic"].find(params);

        return entities.map((entity) => {
          entity.discussions = entity.discussions.length;
          return sanitizeEntity(entity, { model: strapi.models["discussion-topic"]  });
        });
      },
};
