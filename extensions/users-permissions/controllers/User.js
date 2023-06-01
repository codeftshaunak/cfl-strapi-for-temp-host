"use strict";

const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");
const ip = require("ip");

const sanitizeUser = (user) =>
  sanitizeEntity(user, {
    model: strapi.query("user", "users-permissions").model,
  });

module.exports = {
  async me(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }
    console.log('ip address ',ip.address());
    console.log(ctx.request.socket.remoteAddress);

    try {
      strapi.query("user", "users-permissions").update(
        { id: user.id },
        {
          lastLogin: new Date(),
          ipAddress:ctx?.ip
        }
      );

      strapi.query("profile").update(
        { user: user.id },
        {
          lastLogin: new Date(),
        }
      );
    } catch {}

    const group = await strapi.query('group').findOne({users_permissions_users:user.id});
    if(group){
      user.launch = true;
    }

    ctx.body = sanitizeUser(user);
  },
};
