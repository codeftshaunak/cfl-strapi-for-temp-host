'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    async offer(user) {
        // if(user?.badges?.discussCount<=10){
        //     const usr = await strapi
        //     .query("user", "users-permissions")
        //     .model.findOne(
        //       { _id: user.id }
        //     );
        //     let data = usr.badges;
        //     data["discussCount"] = usr.badges?.discussCount?usr.badges?.discussCount+1:1;
        //     await strapi
        //     .query("user", "users-permissions")
        //     .model.updateOne(
        //       { _id: user.id },
        //       { $set: {"badges":data}}
        //     );
        //     if(data["discussCount"]==10){
        //       console.log("give the offer");
        //     }
        // }
    },
};
