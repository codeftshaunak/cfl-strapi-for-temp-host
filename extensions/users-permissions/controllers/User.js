"use strict";

const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");

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

    await strapi.query("user", "users-permissions").update(
      { id: user.id },
      {
        lastLogin: new Date(),
      }
    );

    await strapi.query("profile").update(
      { user: user.id },
      {
        lastLogin: new Date(),
      }
    );

    ctx.body = sanitizeUser(user);
  },
};
