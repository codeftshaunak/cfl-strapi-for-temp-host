'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEntity } = require("strapi-utils");

module.exports = {
    async create(ctx) {
        let entity;
        const user = ctx.state.user;
        console.log(user.id);
        if(!user){
            ctx.badRequest('You are not authorized for this action.');
        }
        let params = ctx.request.body;
        entity = await await strapi.query('report').findOne({
            "type":params.type,
            'typeId':params.typeId,
            'comment':params.comment,
            'users_permissions_user':user.id
        });
        if(entity){
            return ctx.send({ status: true, message:"already reported" });
        }
        entity = await await strapi.query('report').create({
            "type":params.type,
            'typeId':params.typeId,
            'comment':params.comment,
            'users_permissions_user':user.id
        });
        delete entity.users_permissions_user;
        return entity;
    },
};
