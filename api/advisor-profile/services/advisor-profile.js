'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    buildSearchParams(user, query) {
        let params = {
          public: true,
        //   user: { $exists : true, $not : null },
        };
        if (user) {
        //   params["user"] = { $ne: '' };
        }
        if (query.country) {
          params["countryCode"] = query.country;
        }
        if (query.city) {
          params["city"] = query.city;
        }
        if (query.title) {
            params["title"] = query.title;
          }
        // if (query.skills && query.skills.length > 0) {
        //   params["skills"] = { $in: query.skills };
        // }
        if (query.q) {
          params = {
            ...params,
            ...{
              $text: { $search: query.q },
            },
          };
        }
    
        return params;
      },
};
