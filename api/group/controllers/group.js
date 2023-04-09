'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async update(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized("You must be logged in to vote.");
    }
    if (!user.profile) {
      return ctx.unauthorized("You don't have a profile created.");
    }

    const groupEntity = await strapi.query("group").findOne({ _id: id });
    const { users_permissions_users } = groupEntity;
    let newUsers = [user];

    if (users_permissions_users?.length > 0) {
      newUsers = users_permissions_users.find(item => item.id === user.id) ? users_permissions_users : [...users_permissions_users, user]
    }

    const entity = await strapi.services.group.update(
      { id },
      { users_permissions_users: newUsers }
    );
    const found = await strapi.services.autoemail.findOne({ email: user.email })
    if(found){
      await strapi.services.autoemail.update({ email: user.email }, {state:'dontSend'});
    }

    return sanitizeEntity(entity, { model: strapi.models.group });
  },
};
