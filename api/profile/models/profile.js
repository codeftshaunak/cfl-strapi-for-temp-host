"use strict";

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
    // afterCreate: async(result) => {
    //   if(result?.id){
    //     let query = {};
    //     const adminProfile = strapi.config.get("server.admin_profile_id");
    //     query["profiles"] = {$all:[result?.id, adminProfile]};
    //     const connection = await strapi.query("connection").findOne(query);
    //     if(!connection){
    //       const newConnection = {
    //         authorProfile: adminProfile,
    //         profiles: [adminProfile, result.id],
    //         status: "accepted",
    //         message: 'This connection is added by system automation',
    //         updatedOn: new Date(),
    //       };
    //       await strapi.services.connection.create(newConnection);
    //     }else{
    //       await strapi.services.connection.update(
    //         {id:connection.id},{status: "accepted",updatedOn: new Date()}
    //       );
    //     }
    //   }
    // },
    beforeUpdate: async (params, data) => {
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
    // afterUpdate: async(result) => {
    //   if(result?.id){
    //     let query = {};
    //     const adminProfile = strapi.config.get("server.admin_profile_id");
    //     query["profiles"] = {$all:[result?.id, adminProfile]};
    //     const connection = await strapi.query("connection").findOne(query);
    //     if(!connection){
    //       const newConnection = {
    //         authorProfile: adminProfile,
    //         profiles: [adminProfile, result.id],
    //         status: "accepted",
    //         message: 'This connection is added by system automation',
    //         updatedOn: new Date(),
    //       };
    //       await strapi.services.connection.create(newConnection);
    //     }else{
    //       await strapi.services.connection.update(
    //         {id:connection.id},{status: "accepted",updatedOn: new Date()}
    //       );
    //     }
    //   }
    // },
  },
};
