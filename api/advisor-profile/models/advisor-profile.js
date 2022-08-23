'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

 const slugify = require("slugify");

 module.exports = {
   lifecycles: {
     beforeCreate: async (data) => {
       if (data.firstName && data.lastName && !data.slug) {
         data.slug = slugify(
           `${data.firstName} ${data.lastName} ${Math.random()
             .toString(36)
             .slice(2)}`,
           {
             lower: true,
           }
         );
       }
       if (data.city) {
         const city = await strapi.query("city").findOne({ id: data.city });
         data.countryCode = city.countryCode;
       }
     },
     beforeUpdate: async (params, data) => {
      console.log('before update',data);
       if (data.firstName && data.lastName && !data.slug) {
         data.slug = slugify(
           `${data.firstName} ${data.lastName} ${Math.random()
             .toString(36)
             .slice(2)}`,
           {
             lower: true,
           }
         );
         console.log('updating ',data);
       }
       if (data.city) {
         const city = await strapi.query("city").findOne({ id: data.city });
         data.countryCode = city.countryCode;
       }
     },
   },
 };
